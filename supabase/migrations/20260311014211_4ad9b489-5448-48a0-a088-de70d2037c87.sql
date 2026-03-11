
-- Add new columns to academy_courses for YouTube-style display
ALTER TABLE public.academy_courses 
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS instructor_avatar text,
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS course_status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Create tutor_applications table
CREATE TABLE IF NOT EXISTS public.tutor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bio text NOT NULL,
  expertise text[] DEFAULT '{}',
  portfolio_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;

-- RLS for tutor_applications
CREATE POLICY "Users can view own application" ON public.tutor_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application" ON public.tutor_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.tutor_applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications" ON public.tutor_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add tutor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tutor';

-- Create course_ratings table for user ratings
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings" ON public.course_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own rating" ON public.course_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating" ON public.course_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view course thumbnails" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Authenticated users can upload course thumbnails" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-thumbnails');

CREATE POLICY "Users can update own course thumbnails" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'course-thumbnails');
