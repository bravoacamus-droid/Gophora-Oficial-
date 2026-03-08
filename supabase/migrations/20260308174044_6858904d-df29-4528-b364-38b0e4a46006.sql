
-- 1. Profiles table (auto-created on signup via trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  account_type TEXT NOT NULL DEFAULT 'company',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'company')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add user_id to projects table
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update projects RLS to be user-scoped
DROP POLICY IF EXISTS "Allow public insert on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public select on projects" ON public.projects;

CREATE POLICY "Users can view all projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 3. Mission applications table
CREATE TABLE public.mission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mission_id, user_id)
);

ALTER TABLE public.mission_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.mission_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON public.mission_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can view applications" ON public.mission_applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      JOIN public.projects p ON m.project_id = p.id
      WHERE m.id = mission_id AND p.user_id = auth.uid()
    )
  );

-- 4. Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. Update missions RLS to be user-scoped
DROP POLICY IF EXISTS "Allow public insert on missions" ON public.missions;
DROP POLICY IF EXISTS "Allow public select on missions" ON public.missions;

CREATE POLICY "Anyone authenticated can view missions" ON public.missions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project owners can insert missions" ON public.missions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()
    )
  );
