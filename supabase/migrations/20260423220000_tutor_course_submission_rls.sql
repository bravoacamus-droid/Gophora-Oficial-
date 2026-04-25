-- Tutor course submission flow — fixes the "Enviar para Revisión" button
-- which was silently failing because:
--   1. academy_courses had no `submitted_by` column even though both the
--      hook (useSubmitCourseAsTutor) and the dashboard (tutorCourses
--      filter, follow-tutor button) reference it. INSERT raised
--      "column submitted_by does not exist".
--   2. RLS was enabled on academy_courses with only a SELECT policy, so
--      any tutor INSERT was rejected even after the column was added.
--   3. course_exam_questions had RLS enabled with NO policies at all,
--      so the second INSERT (exam questions) was always rejected too.

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- academy_courses: tutors can create + edit their own; admins manage all
CREATE POLICY "Tutors can submit their own courses"
  ON public.academy_courses
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Tutors can update their own courses"
  ON public.academy_courses
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins manage all courses"
  ON public.academy_courses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- course_exam_questions: everyone authenticated can read (needed to take
-- exams), tutors can manage questions only on courses they submitted.
CREATE POLICY "Authenticated can read exam questions"
  ON public.course_exam_questions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Tutors can insert exam questions for their own courses"
  ON public.course_exam_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_courses ac
      WHERE ac.id = course_exam_questions.course_id
        AND ac.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Tutors can update exam questions of their own courses"
  ON public.course_exam_questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_courses ac
      WHERE ac.id = course_exam_questions.course_id
        AND ac.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Tutors can delete exam questions of their own courses"
  ON public.course_exam_questions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_courses ac
      WHERE ac.id = course_exam_questions.course_id
        AND ac.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage all exam questions"
  ON public.course_exam_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
