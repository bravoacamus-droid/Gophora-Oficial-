-- Course delivery mode (live webinar vs pre-recorded). Until now there
-- was no way to distinguish a scheduled live session from an evergreen
-- recording in the UI — every course showed the same generic "Cursos"
-- badge. This adds a real flag and a scheduled time so we can surface
-- 🔴 EN VIVO / 📼 GRABADA badges and a "starts in 2h" countdown.

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'recorded'
    CHECK (delivery_mode IN ('live', 'recorded')),
  ADD COLUMN IF NOT EXISTS live_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS academy_courses_delivery_mode_idx
  ON public.academy_courses (delivery_mode);

CREATE INDEX IF NOT EXISTS academy_courses_live_at_idx
  ON public.academy_courses (live_at)
  WHERE delivery_mode = 'live';
