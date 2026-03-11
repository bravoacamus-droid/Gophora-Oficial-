
CREATE TABLE public.course_exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_es text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  options_es jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam questions for published courses"
  ON public.course_exam_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_courses
      WHERE id = course_exam_questions.course_id
      AND course_status = 'published'
    )
  );

CREATE POLICY "Tutors can view own course exam questions"
  ON public.course_exam_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_courses
      WHERE id = course_exam_questions.course_id
      AND submitted_by = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert exam questions for own courses"
  ON public.course_exam_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_courses
      WHERE id = course_exam_questions.course_id
      AND submitted_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage exam questions"
  ON public.course_exam_questions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
