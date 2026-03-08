
-- 1. Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add payment_status to projects
ALTER TABLE public.projects ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- 5. Add admin approval fields to missions
ALTER TABLE public.missions ADD COLUMN approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.missions ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- 6. Admin policies: admins can do everything on projects and missions
CREATE POLICY "Admins can update any project" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any project" ON public.projects
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any mission" ON public.missions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any mission" ON public.missions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admins can view all profiles (already public select, but let's ensure)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.mission_applications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications" ON public.mission_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
