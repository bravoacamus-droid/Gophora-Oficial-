
-- Add verification_source and category to explorer_skills
ALTER TABLE public.explorer_skills 
  ADD COLUMN IF NOT EXISTS verification_source text NOT NULL DEFAULT 'exam',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'AI Tools';

-- Create explorer_badges table
CREATE TABLE public.explorer_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  badge_key text NOT NULL,
  badge_name text NOT NULL,
  badge_name_es text,
  badge_icon text NOT NULL DEFAULT '🏅',
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(explorer_id, badge_key)
);

ALTER TABLE public.explorer_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.explorer_badges
  FOR SELECT TO authenticated USING (auth.uid() = explorer_id);

CREATE POLICY "Users can insert own badges" ON public.explorer_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);

CREATE POLICY "Anyone can view badges" ON public.explorer_badges
  FOR SELECT TO authenticated USING (true);
