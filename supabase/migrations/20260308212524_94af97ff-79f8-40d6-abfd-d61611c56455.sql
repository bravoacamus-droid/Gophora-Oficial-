
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hobbies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS education text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS talents text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
