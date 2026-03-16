
-- Daily activity tracking for streaks
CREATE TABLE public.explorer_daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id uuid NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  courses_viewed integer NOT NULL DEFAULT 0,
  exams_taken integer NOT NULL DEFAULT 0,
  missions_activated integer NOT NULL DEFAULT 0,
  missions_delivered integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(explorer_id, activity_date)
);

ALTER TABLE public.explorer_daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.explorer_daily_activity
  FOR SELECT TO authenticated USING (auth.uid() = explorer_id);

CREATE POLICY "Users can insert own activity" ON public.explorer_daily_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = explorer_id);

CREATE POLICY "Users can update own activity" ON public.explorer_daily_activity
  FOR UPDATE TO authenticated USING (auth.uid() = explorer_id);

-- Public read for social proof (aggregate only, RLS allows select for all authenticated)
CREATE POLICY "Anyone can view activity for social proof" ON public.explorer_daily_activity
  FOR SELECT TO authenticated USING (true);
