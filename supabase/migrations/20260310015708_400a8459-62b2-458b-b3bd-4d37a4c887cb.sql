
-- Academy Learning Paths
CREATE TABLE public.academy_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_es text,
  description text,
  description_es text,
  icon text DEFAULT 'BookOpen',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view paths" ON public.academy_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage paths" ON public.academy_paths FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Academy Courses
CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES public.academy_paths(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  title_es text,
  description text,
  description_es text,
  platform text DEFAULT 'YouTube',
  external_url text,
  duration_minutes integer DEFAULT 30,
  skill_level text NOT NULL DEFAULT 'beginner',
  language text NOT NULL DEFAULT 'en',
  skills_learned text[] DEFAULT '{}',
  category text DEFAULT 'general',
  tool text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view courses" ON public.academy_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Academy Tools
CREATE TABLE public.academy_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_es text,
  description text,
  description_es text,
  category text NOT NULL,
  url text,
  icon text DEFAULT 'Wrench',
  use_cases text[] DEFAULT '{}',
  use_cases_es text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view tools" ON public.academy_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tools" ON public.academy_tools FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Explorer Course Progress
CREATE TABLE public.explorer_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.explorer_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.explorer_course_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.explorer_course_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.explorer_course_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.explorer_course_progress FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Community Shared Prompts
CREATE TABLE public.academy_shared_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  likes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_shared_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view prompts" ON public.academy_shared_prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own prompts" ON public.academy_shared_prompts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.academy_shared_prompts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.academy_shared_prompts FOR DELETE TO authenticated USING (auth.uid() = user_id);
