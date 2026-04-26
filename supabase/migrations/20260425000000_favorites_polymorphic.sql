-- Polymorphic favorites table for paths + playbooks (course favorites
-- already exist as explorer_favorite_courses and stay there). The Favoritos
-- tab unions both tables under one UI.

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('path', 'playbook')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS favorites_user_type_idx ON public.favorites (user_id, item_type);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own favorites"   ON public.favorites;
DROP POLICY IF EXISTS "Users add own favorites"   ON public.favorites;
DROP POLICY IF EXISTS "Users remove own favorites" ON public.favorites;

CREATE POLICY "Users see own favorites"
  ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users add own favorites"
  ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users remove own favorites"
  ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
