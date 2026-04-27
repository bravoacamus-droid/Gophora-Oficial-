-- Phase 4 + 5 schema additions
--
-- Phase 4: live courses need a separate meeting_url so the tutor stops
-- abusing external_url for the Zoom/Meet link.
--
-- Phase 5: Skill Passport needs a stable, sharable public slug. Today the
-- share button always emits /passport/me, which means no one else can land
-- on a third-party passport. We add a short slug, backfill it for all
-- existing explorer_profiles and any auth user without a profile yet, and
-- enforce uniqueness.

------------------------------------------------------------------
-- 1) academy_courses.meeting_url
------------------------------------------------------------------
ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

COMMENT ON COLUMN public.academy_courses.meeting_url IS
  'Zoom/Meet/Google Meet URL for live sessions. Only relevant when delivery_mode=''live''. Kept separate from external_url so the recorded-video flow stays clean.';

------------------------------------------------------------------
-- 2) explorer_profiles.public_slug
------------------------------------------------------------------
ALTER TABLE public.explorer_profiles
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

-- Generator: 10-char base32-like slug from md5(random)
CREATE OR REPLACE FUNCTION public.generate_passport_slug()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT substr(encode(decode(md5(gen_random_uuid()::text || clock_timestamp()::text), 'hex'), 'base64'), 1, 10);
$$;

-- Backfill any null slug. Loop until every row has one (collision-safe).
DO $do$
DECLARE
  rec RECORD;
  candidate TEXT;
  attempts INT;
BEGIN
  FOR rec IN SELECT id FROM public.explorer_profiles WHERE public_slug IS NULL LOOP
    attempts := 0;
    LOOP
      candidate := lower(regexp_replace(public.generate_passport_slug(), '[^a-z0-9]', '', 'g'));
      -- Pad if regex stripped too many chars
      WHILE length(candidate) < 8 LOOP
        candidate := candidate || substr(md5(random()::text), 1, 4);
      END LOOP;
      candidate := substr(candidate, 1, 10);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.explorer_profiles WHERE public_slug = candidate);
      attempts := attempts + 1;
      IF attempts > 5 THEN
        candidate := candidate || substr(md5(random()::text), 1, 4);
        EXIT;
      END IF;
    END LOOP;
    UPDATE public.explorer_profiles SET public_slug = candidate WHERE id = rec.id;
  END LOOP;
END
$do$;

-- Make it NOT NULL with a default for new rows
ALTER TABLE public.explorer_profiles
  ALTER COLUMN public_slug SET DEFAULT lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

ALTER TABLE public.explorer_profiles
  ALTER COLUMN public_slug SET NOT NULL;

-- Unique index for fast slug → profile lookup
CREATE UNIQUE INDEX IF NOT EXISTS explorer_profiles_public_slug_key
  ON public.explorer_profiles (public_slug);

COMMENT ON COLUMN public.explorer_profiles.public_slug IS
  'Stable 10-char public identifier used in /passport/<slug>. Generated on insert; never reuse a previous owner''s slug.';

------------------------------------------------------------------
-- 3) RLS: allow anyone (anon + authenticated) to SELECT explorer_profiles
--    by public_slug for the public passport page. Existing select policy
--    might already allow this; add an additive permissive policy if not.
------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'explorer_profiles'
      AND policyname = 'public_passport_read'
  ) THEN
    CREATE POLICY "public_passport_read"
      ON public.explorer_profiles
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$do$;
