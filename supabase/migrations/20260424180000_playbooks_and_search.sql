-- Three connected features for the community prompt library:
-- (1) Idea 4: Postgres full-text search with a generated tsvector column +
--     GIN index + RPC `search_prompts(_query, _skill)` so the UI can search
--     "necesito escribir emails de seguimiento" without picking a category.
-- (2) Idea 2: prompt_playbooks (tutor-curated bundles of 3-7 prompts in
--     order) + playbook_completions (explorer progress). RLS lets approved
--     tutors create playbooks, anyone read, explorers track their own
--     completions. A trigger increments the playbook's completion_count
--     so we can show "completed by N explorers" without a join.
-- (3) Schema-only support for Idea 3 (improve-prompt Edge Function) — that
--     one needs no DB change, just a deployed function.

-- ─── Idea 4: full-text search ──────────────────────────────────────────
-- Generated tsvector uses the 'spanish' config so Spanish stemming kicks in
-- ("ventas" matches "venta", "emails" matches "email", stopwords are stripped).
-- Mixed-language content (Spanish prompts with English tool names like
-- "ChatGPT" or technical words) still works because unrecognised tokens pass
-- through unchanged.
ALTER TABLE public.academy_shared_prompts
  ADD COLUMN IF NOT EXISTS search_vec tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      coalesce(title, '') || ' ' ||
      coalesce(title_es, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(content_es, '') || ' ' ||
      coalesce(skill, '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS academy_shared_prompts_search_idx
  ON public.academy_shared_prompts USING GIN(search_vec);

CREATE OR REPLACE FUNCTION public.search_prompts(_query text, _skill text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
BEGIN
  -- Primary: Spanish-stemmed full-text rank
  RETURN QUERY
  SELECT
    sp.id,
    ts_rank_cd(sp.search_vec, plainto_tsquery('spanish', _query))::real AS rank
  FROM public.academy_shared_prompts sp
  WHERE sp.search_vec @@ plainto_tsquery('spanish', _query)
    AND (_skill IS NULL OR sp.skill = _skill)
  ORDER BY rank DESC, sp.is_official DESC, sp.created_at DESC
  LIMIT 12;

  -- Fallback: literal ILIKE so "single weird token" queries still surface
  -- something rather than an empty list.
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT sp.id, 0.01::real AS rank
    FROM public.academy_shared_prompts sp
    WHERE (sp.title ILIKE '%' || _query || '%' OR sp.content ILIKE '%' || _query || '%')
      AND (_skill IS NULL OR sp.skill = _skill)
    ORDER BY sp.is_official DESC, sp.created_at DESC
    LIMIT 12;
  END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.search_prompts(text, text) TO authenticated;

-- ─── Idea 2: prompt_playbooks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompt_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_es text,
  description text,
  description_es text,
  skill text,
  prompt_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT true,
  completion_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prompt_playbooks_author_idx ON public.prompt_playbooks (author_id);
CREATE INDEX IF NOT EXISTS prompt_playbooks_skill_idx ON public.prompt_playbooks (skill);
CREATE INDEX IF NOT EXISTS prompt_playbooks_completion_idx ON public.prompt_playbooks (completion_count DESC);

ALTER TABLE public.prompt_playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view playbooks"     ON public.prompt_playbooks;
DROP POLICY IF EXISTS "Approved tutors can create playbooks"        ON public.prompt_playbooks;
DROP POLICY IF EXISTS "Authors can update their own playbooks"      ON public.prompt_playbooks;
DROP POLICY IF EXISTS "Authors can delete their own playbooks"      ON public.prompt_playbooks;
DROP POLICY IF EXISTS "Admins manage all playbooks"                 ON public.prompt_playbooks;

CREATE POLICY "Anyone authenticated can view playbooks"
  ON public.prompt_playbooks
  FOR SELECT TO authenticated
  USING (is_published OR author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved tutors can create playbooks"
  ON public.prompt_playbooks
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tutor_applications
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Authors can update their own playbooks"
  ON public.prompt_playbooks
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their own playbooks"
  ON public.prompt_playbooks
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins manage all playbooks"
  ON public.prompt_playbooks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ─── playbook_completions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playbook_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playbook_id uuid NOT NULL REFERENCES public.prompt_playbooks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, playbook_id)
);

CREATE INDEX IF NOT EXISTS playbook_completions_user_idx ON public.playbook_completions (user_id);
CREATE INDEX IF NOT EXISTS playbook_completions_playbook_idx ON public.playbook_completions (playbook_id);

ALTER TABLE public.playbook_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users record their own completions"       ON public.playbook_completions;
DROP POLICY IF EXISTS "Users see their own completions"          ON public.playbook_completions;
DROP POLICY IF EXISTS "Authors see who completed their playbook" ON public.playbook_completions;
DROP POLICY IF EXISTS "Admins read all completions"              ON public.playbook_completions;

CREATE POLICY "Users record their own completions"
  ON public.playbook_completions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see their own completions"
  ON public.playbook_completions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authors see who completed their playbook"
  ON public.playbook_completions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prompt_playbooks pb
      WHERE pb.id = playbook_completions.playbook_id
        AND pb.author_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all completions"
  ON public.playbook_completions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ─── Trigger: increment playbook completion_count ──────────────────────
CREATE OR REPLACE FUNCTION public.on_playbook_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompt_playbooks
    SET completion_count = completion_count + 1,
        updated_at = now()
    WHERE id = NEW.playbook_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS playbook_completed_increment ON public.playbook_completions;
CREATE TRIGGER playbook_completed_increment
  AFTER INSERT ON public.playbook_completions
  FOR EACH ROW EXECUTE FUNCTION public.on_playbook_completed();
