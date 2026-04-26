-- Let approved tutors create their own learning paths.
-- Until now academy_paths was admin-only. We add author_id + is_published
-- and three new RLS policies (insert / update / delete) gated to tutors
-- whose tutor_applications is approved. The existing "Admins can manage
-- paths" policy and the public SELECT stay untouched.
--
-- Existing admin-curated paths keep author_id = NULL — those are still
-- managed exclusively by the admin policy.

ALTER TABLE public.academy_paths
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS academy_paths_author_idx ON public.academy_paths (author_id);

DROP POLICY IF EXISTS "Approved tutors can create paths"  ON public.academy_paths;
DROP POLICY IF EXISTS "Authors update own paths"          ON public.academy_paths;
DROP POLICY IF EXISTS "Authors delete own paths"          ON public.academy_paths;

CREATE POLICY "Approved tutors can create paths"
  ON public.academy_paths
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tutor_applications
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Authors update own paths"
  ON public.academy_paths
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors delete own paths"
  ON public.academy_paths
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());
