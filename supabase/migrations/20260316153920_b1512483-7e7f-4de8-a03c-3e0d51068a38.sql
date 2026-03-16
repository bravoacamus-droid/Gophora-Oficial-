
-- Tutor followers table
CREATE TABLE public.tutor_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  explorer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, explorer_id)
);
ALTER TABLE public.tutor_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow tutors" ON public.tutor_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);
CREATE POLICY "Users can unfollow tutors" ON public.tutor_followers FOR DELETE TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Anyone can view followers" ON public.tutor_followers FOR SELECT TO authenticated USING (true);

-- Explorer favorite courses
CREATE TABLE public.explorer_favorite_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(explorer_id, course_id)
);
ALTER TABLE public.explorer_favorite_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can save favorites" ON public.explorer_favorite_courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);
CREATE POLICY "Users can remove favorites" ON public.explorer_favorite_courses FOR DELETE TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Users can view own favorites" ON public.explorer_favorite_courses FOR SELECT TO authenticated USING (auth.uid() = explorer_id);

-- Explorer skills table
CREATE TABLE public.explorer_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  skill_name text NOT NULL,
  skill_level integer NOT NULL DEFAULT 1,
  verified_by_exam boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(explorer_id, skill_name)
);
ALTER TABLE public.explorer_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills" ON public.explorer_skills FOR SELECT TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Users can insert own skills" ON public.explorer_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);
CREATE POLICY "Users can update own skills" ON public.explorer_skills FOR UPDATE TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Admins can view all skills" ON public.explorer_skills FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Explorer exam attempts
CREATE TABLE public.explorer_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  attempt_number integer NOT NULL DEFAULT 1,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.explorer_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.explorer_exam_attempts FOR SELECT TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Users can insert own attempts" ON public.explorer_exam_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);
CREATE POLICY "Admins can view all attempts" ON public.explorer_exam_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Certificates table
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  tutor_name text,
  explorer_name text,
  course_title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  UNIQUE(explorer_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = explorer_id);
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);
CREATE POLICY "Anyone can verify certificates" ON public.certificates FOR SELECT TO public USING (true);

-- Add counters to academy_courses
ALTER TABLE public.academy_courses 
  ADD COLUMN IF NOT EXISTS total_students integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_exam_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_passed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_followers integer DEFAULT 0;
