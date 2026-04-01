-- GOPHORA MEGA MIGRATION
-- Purge existing conflicting tables to start from zero
DROP TABLE IF EXISTS public.deliverables CASCADE;
DROP TABLE IF EXISTS public.mission_assignments CASCADE;
DROP TABLE IF EXISTS public.mission_applications CASCADE;
DROP TABLE IF EXISTS public.missions CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.project_missions CASCADE;
DROP TABLE IF EXISTS public.skill_passports CASCADE;
DROP TABLE IF EXISTS public.explorer_profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.academy_courses CASCADE;

-- Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_role') THEN
        CREATE TYPE account_role AS ENUM ('explorer', 'company');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_status') THEN
        CREATE TYPE mission_status AS ENUM ('open', 'in_progress', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('funding', 'active', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid');
    END IF;
END $$;

-- 1. Explorer Profiles
CREATE TABLE public.explorer_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    skills jsonb DEFAULT '[]'::jsonb,
    xp int DEFAULT 0,
    level int DEFAULT 1,
    availability_hours int DEFAULT 0,
    rating float DEFAULT 5.0,
    created_at timestamptz DEFAULT now()
);

-- 2. Company Profiles
CREATE TABLE public.company_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name text,
    industry text,
    budget_monthly numeric DEFAULT 0,
    is_investor boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Skill Passports
CREATE TABLE public.skill_passports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    explorer_id uuid REFERENCES public.explorer_profiles(id) ON DELETE CASCADE,
    skills_verified jsonb DEFAULT '[]'::jsonb,
    missions_completed int DEFAULT 0,
    badges jsonb DEFAULT '[]'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 4. Missions
CREATE TABLE public.missions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    budget numeric DEFAULT 0,
    duration_hours int DEFAULT 0,
    status mission_status DEFAULT 'open',
    created_at timestamptz DEFAULT now()
);

-- 5. Mission Assignments (Uber-flow)
CREATE TABLE public.mission_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
    explorer_id uuid REFERENCES public.explorer_profiles(id) ON DELETE CASCADE,
    status assignment_status DEFAULT 'assigned',
    started_at timestamptz DEFAULT now(),
    submitted_at timestamptz,
    approved_at timestamptz
);

-- 6. Deliverables
CREATE TABLE public.deliverables (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id uuid REFERENCES public.mission_assignments(id) ON DELETE CASCADE,
    file_url text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 7. Payments
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
    explorer_id uuid REFERENCES public.explorer_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status payment_status DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 8. Dream Academy Courses
CREATE TABLE public.academy_courses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    video_url text,
    category text,
    created_at timestamptz DEFAULT now()
);

-- 9. Course Progress
CREATE TABLE public.course_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    explorer_id uuid REFERENCES public.explorer_profiles(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
    progress int DEFAULT 0,
    completed boolean DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

-- 10. Projects (Funding)
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    explorer_id uuid REFERENCES public.explorer_profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    budget_needed numeric NOT NULL,
    status project_status DEFAULT 'funding',
    created_at timestamptz DEFAULT now()
);

-- 11. Investments
CREATE TABLE public.investments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 12. Project Missions (Link projects to executed missions)
CREATE TABLE public.project_missions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE
);

-- RLS (Basic - To be refined)
ALTER TABLE public.explorer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all for now during development phase (MVP)
CREATE POLICY "Public Read" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Public Read Courses" ON public.academy_courses FOR SELECT USING (true);
