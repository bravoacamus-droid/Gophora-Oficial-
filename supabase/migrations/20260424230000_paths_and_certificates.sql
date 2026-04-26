-- Paths flow + path-level certificates with auto-issue on completion.
-- (1) Extend certificates: path_id, cert_type ('course' | 'path' | 'achievement'),
--     plus achievement_title / achievement_summary for non-course certificates.
-- (2) New path_enrollments table so explorers explicitly opt-in to a path
--     and we can show progress. UNIQUE(user_id, path_id) prevents double
--     enrollment.
-- (3) check_path_completion(user_id) function that walks each enrollment
--     and, when every published course in a path is completed, marks the
--     enrollment as done and issues a 'path' certificate.
-- (4) on_course_completed trigger fires that function whenever the user
--     finishes a course (INSERT with completed=true or UPDATE flipping
--     completed false→true).

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS path_id uuid REFERENCES public.academy_paths(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cert_type text NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS achievement_title text,
  ADD COLUMN IF NOT EXISTS achievement_summary text;

CREATE INDEX IF NOT EXISTS certificates_path_idx ON public.certificates (path_id);
CREATE INDEX IF NOT EXISTS certificates_code_idx ON public.certificates (certificate_code);

CREATE TABLE IF NOT EXISTS public.path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES public.academy_paths(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  UNIQUE (user_id, path_id)
);

CREATE INDEX IF NOT EXISTS path_enrollments_user_idx ON public.path_enrollments (user_id);
CREATE INDEX IF NOT EXISTS path_enrollments_path_idx ON public.path_enrollments (path_id);

ALTER TABLE public.path_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own enrollments"          ON public.path_enrollments;
DROP POLICY IF EXISTS "Users enroll themselves"            ON public.path_enrollments;
DROP POLICY IF EXISTS "Users update own enrollments"       ON public.path_enrollments;
DROP POLICY IF EXISTS "Admins read all enrollments"        ON public.path_enrollments;

CREATE POLICY "Users see own enrollments"
  ON public.path_enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users enroll themselves"
  ON public.path_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own enrollments"
  ON public.path_enrollments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all enrollments"
  ON public.path_enrollments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ─── Path completion function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_path_completion(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_explorer_name text;
  v_total_courses int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(full_name, username, 'Explorer') INTO v_explorer_name
    FROM profiles WHERE id = _user_id;

  -- Walk every active enrollment for this user.
  FOR r IN
    SELECT pe.id AS enrollment_id, pe.path_id, p.title AS path_title
    FROM path_enrollments pe
    JOIN academy_paths p ON p.id = pe.path_id
    WHERE pe.user_id = _user_id
      AND pe.completed_at IS NULL
  LOOP
    -- Total published courses in this path. Skip paths with zero courses
    -- so we don't issue a cert for empty paths.
    SELECT COUNT(*) INTO v_total_courses
      FROM academy_courses
      WHERE path_id = r.path_id AND course_status = 'published';

    IF v_total_courses = 0 THEN CONTINUE; END IF;

    -- If no remaining incomplete published course exists, the path is done.
    IF NOT EXISTS (
      SELECT 1 FROM academy_courses ac
      WHERE ac.path_id = r.path_id
        AND ac.course_status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM explorer_course_progress ep
          WHERE ep.user_id = _user_id AND ep.course_id = ac.id AND ep.completed = true
        )
    ) THEN
      UPDATE path_enrollments SET completed_at = now() WHERE id = r.enrollment_id;

      -- Idempotent: don't double-issue for the same path.
      IF NOT EXISTS (
        SELECT 1 FROM certificates
        WHERE explorer_id = _user_id AND path_id = r.path_id AND cert_type = 'path'
      ) THEN
        INSERT INTO certificates (
          explorer_id, path_id, cert_type, course_title,
          achievement_title, achievement_summary, certificate_code, explorer_name
        )
        VALUES (
          _user_id,
          r.path_id,
          'path',
          r.path_title,
          'Ruta de aprendizaje completada',
          'Completaste todos los cursos de la ruta "' || r.path_title || '" en GOPHORA Academy.',
          'GP-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 10) || '-' || to_char(now(), 'YYMMDD'),
          v_explorer_name
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_path_completion(uuid) TO authenticated;

-- ─── Trigger: re-check on each course completion ───────────────────────
CREATE OR REPLACE FUNCTION public.on_course_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed = true AND (TG_OP = 'INSERT' OR OLD.completed IS DISTINCT FROM true) THEN
    PERFORM check_path_completion(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_completed_check_path ON public.explorer_course_progress;
CREATE TRIGGER course_completed_check_path
  AFTER INSERT OR UPDATE ON public.explorer_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.on_course_completed();
