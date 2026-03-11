
-- Allow tutors to insert their own courses (pending review)
CREATE POLICY "Tutors can insert own courses" ON public.academy_courses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') AND
    submitted_by = auth.uid() AND
    course_status = 'pending_review'
  );

-- Allow tutors to view their own submitted courses
CREATE POLICY "Tutors can view own courses" ON public.academy_courses
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- Function to increment course views
CREATE OR REPLACE FUNCTION public.increment_course_views(_course_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE academy_courses
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = _course_id;
$$;
