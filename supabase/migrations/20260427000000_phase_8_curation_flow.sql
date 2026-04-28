-- Phase 8: GOPHORA-curated delivery flow + 72h countdown.
--
-- Model change: explorers no longer deliver directly to the company.
-- Submissions go to the admin queue, the admin picks the top 3-4 and
-- "presents" them to the company. The company picks one winner; the
-- losers receive a "not selected" notification (no payment). Missions
-- can be archived when the company is satisfied. Active assignments
-- expire after 72h from started_at, freeing the slot for someone else.

------------------------------------------------------------------
-- 1) Enable pg_cron + pg_net (used to schedule the expiry job)
------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

------------------------------------------------------------------
-- 2) Extend enums (Postgres can't drop enum values, so we just add)
------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.mission_status'::regtype AND enumlabel = 'archived') THEN
    ALTER TYPE public.mission_status ADD VALUE 'archived';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.assignment_status'::regtype AND enumlabel = 'expired') THEN
    ALTER TYPE public.assignment_status ADD VALUE 'expired';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.assignment_status'::regtype AND enumlabel = 'not_selected') THEN
    ALTER TYPE public.assignment_status ADD VALUE 'not_selected';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.assignment_status'::regtype AND enumlabel = 'presented') THEN
    ALTER TYPE public.assignment_status ADD VALUE 'presented';
  END IF;
END
$do$;

------------------------------------------------------------------
-- 3) New columns on missions for the curation rounds + countdown
------------------------------------------------------------------
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS presented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS present_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_present_attempts INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS deadline_hours INT NOT NULL DEFAULT 72;

COMMENT ON COLUMN public.missions.presented_at IS 'Timestamp of the most recent batch presentation to the company. NULL means never presented yet.';
COMMENT ON COLUMN public.missions.present_attempts IS 'How many curation rounds have been sent to the company. Incremented on present, reset never.';
COMMENT ON COLUMN public.missions.max_present_attempts IS 'After this many failed rounds the admin can cancel the mission and refund the client (currently informational, enforced by UI).';
COMMENT ON COLUMN public.missions.deadline_hours IS 'Active assignments expire this many hours after started_at. Default 72 — the GOPHORA standard.';

------------------------------------------------------------------
-- 4) Function: expire_overdue_assignments
--    Marks any mission_assignments past their deadline as 'expired'.
--    Idempotent — safe to call from cron, edge functions, or page loads.
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_overdue_assignments()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH expired AS (
    UPDATE public.mission_assignments a
    SET status = 'expired'
    FROM public.missions m
    WHERE a.mission_id = m.id
      AND a.status IN ('assigned', 'in_progress')
      AND a.started_at IS NOT NULL
      AND a.started_at + (m.deadline_hours || ' hours')::interval < now()
    RETURNING a.id, a.explorer_id, m.title, m.id AS mission_id
  )
  INSERT INTO public.notifications (user_id, type, title, title_es, body, body_es, link)
  SELECT
    ep.user_id,
    'mission_expired',
    'Mission deadline expired',
    'Venció el plazo de tu misión',
    e.title,
    e.title,
    '/explorer'
  FROM expired e
  JOIN public.explorer_profiles ep ON ep.id = e.explorer_id
  WHERE ep.user_id IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_overdue_assignments() TO authenticated, anon;

------------------------------------------------------------------
-- 5) Schedule it hourly via pg_cron
------------------------------------------------------------------
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop existing schedule if any, then re-add. cron.schedule errors on
    -- duplicate jobs by name, so we use unschedule first.
    PERFORM cron.unschedule('expire-overdue-assignments') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'expire-overdue-assignments'
    );
    PERFORM cron.schedule(
      'expire-overdue-assignments',
      '0 * * * *',  -- top of every hour
      $cron$ SELECT public.expire_overdue_assignments(); $cron$
    );
  END IF;
END
$do$;

------------------------------------------------------------------
-- 6) Update mission_assignment_notify trigger:
--    mission_taken / mission_delivered now go to admins, not the
--    project owner. The company sees deliveries only after the admin
--    explicitly presents them via present_assignments_to_company.
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_mission_assignment_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_explorer_user UUID;
  v_mission_title TEXT;
  v_admin RECORD;
BEGIN
  SELECT user_id INTO v_explorer_user
    FROM public.explorer_profiles
    WHERE id = NEW.explorer_id;

  SELECT m.title INTO v_mission_title
    FROM public.missions m
    WHERE m.id = NEW.mission_id;

  IF TG_OP = 'INSERT' THEN
    -- Explorer just took the mission → notify all admins (centralised model)
    FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.notify_user(
        v_admin.user_id,
        'mission_taken',
        'Explorer activated a mission',
        'Un explorer activó una misión',
        v_mission_title,
        v_mission_title,
        '/admin'
      );
    END LOOP;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Delivery received → admins (so they can curate)
    IF NEW.status = 'submitted' OR (NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL) THEN
      FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        PERFORM public.notify_user(
          v_admin.user_id,
          'mission_delivered',
          'New delivery to curate',
          'Nueva entrega para curar',
          v_mission_title,
          v_mission_title,
          '/admin'
        );
      END LOOP;
    END IF;

    -- Selected for presentation to company
    IF NEW.status = 'presented' THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'assignment_presented',
        'Your delivery was shortlisted ⭐',
        'Tu entrega fue preseleccionada ⭐',
        v_mission_title,
        v_mission_title,
        '/explorer'
      );
    END IF;

    -- Approved by company → explorer wins
    IF NEW.status = 'approved' THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'mission_approved',
        'Your work was approved! 🎉',
        '¡Tu trabajo fue aprobado! 🎉',
        v_mission_title,
        v_mission_title,
        '/explorer'
      );
    END IF;

    -- Not selected (siblings of the approved one)
    IF NEW.status = 'not_selected' THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'assignment_not_selected',
        'Your delivery was not selected this time',
        'Tu entrega no fue seleccionada esta vez',
        'The company picked another delivery for "' || v_mission_title || '". No payment for this round.',
        'La empresa eligió otra entrega para "' || v_mission_title || '". Sin pago en esta ronda.',
        '/explorer'
      );
    END IF;

    -- Rejected by admin
    IF NEW.status = 'rejected' THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'mission_rejected',
        'Your delivery was rejected',
        'Tu entrega fue rechazada',
        COALESCE(NEW.review_note, v_mission_title),
        COALESCE(NEW.review_note, v_mission_title),
        '/explorer'
      );
    END IF;

    -- Funds released
    IF NEW.status = 'funds_released' OR (NEW.funds_released_at IS NOT NULL AND OLD.funds_released_at IS NULL) THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'funds_released',
        'Funds released — money is yours 💰',
        'Fondos liberados — la plata es tuya 💰',
        v_mission_title,
        v_mission_title,
        '/explorer'
      );
    END IF;

    -- Completed (terminal)
    IF NEW.status = 'completed' THEN
      PERFORM public.notify_user(
        v_explorer_user,
        'mission_completed',
        'Mission marked as completed',
        'Misión marcada como completada',
        v_mission_title,
        v_mission_title,
        '/explorer'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

------------------------------------------------------------------
-- 7) Function: present_assignments_to_company
--    Admin selects 1-4 submitted assignments and "presents" them.
--    They flip to status='presented' and the company gets one notification.
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.present_assignments_to_company(
  _mission_id UUID,
  _assignment_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller UUID;
  v_is_admin BOOLEAN;
  v_company_user UUID;
  v_mission_title TEXT;
  v_count INT;
BEGIN
  v_caller := auth.uid();
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = v_caller AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF _assignment_ids IS NULL OR array_length(_assignment_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No assignments selected';
  END IF;
  IF array_length(_assignment_ids, 1) > 4 THEN
    RAISE EXCEPTION 'Cannot present more than 4 deliveries at once';
  END IF;

  SELECT m.title, p.user_id INTO v_mission_title, v_company_user
    FROM public.missions m
    JOIN public.projects p ON p.id = m.project_id
    WHERE m.id = _mission_id;

  IF v_company_user IS NULL THEN
    RAISE EXCEPTION 'Mission % has no company owner', _mission_id;
  END IF;

  -- Flip selected assignments to 'presented'
  UPDATE public.mission_assignments
  SET status = 'presented'
  WHERE id = ANY(_assignment_ids)
    AND mission_id = _mission_id
    AND status IN ('submitted', 'approved');
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'None of the selected assignments are ready to present';
  END IF;

  -- Bump mission attempt counter and stamp the time
  UPDATE public.missions
  SET presented_at = now(),
      present_attempts = present_attempts + 1
  WHERE id = _mission_id;

  -- One consolidated notification to the company
  PERFORM public.notify_user(
    v_company_user,
    'deliveries_presented',
    'Deliveries ready for review',
    'Entregables listos para revisar',
    v_count || ' delivery(ies) for "' || v_mission_title || '"',
    v_count || ' entregable(s) para "' || v_mission_title || '"',
    '/company'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.present_assignments_to_company(UUID, UUID[]) TO authenticated;

------------------------------------------------------------------
-- 8) Function: company_pick_winner
--    Company selects ONE assignment from the presented batch. That one
--    flips to 'approved' (admin will then release funds), the other
--    presented siblings flip to 'not_selected'. Only the project owner
--    can call this.
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_pick_winner(_assignment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller UUID;
  v_mission_id UUID;
  v_owner UUID;
BEGIN
  v_caller := auth.uid();

  SELECT a.mission_id, p.user_id INTO v_mission_id, v_owner
  FROM public.mission_assignments a
  JOIN public.missions m ON m.id = a.mission_id
  JOIN public.projects p ON p.id = m.project_id
  WHERE a.id = _assignment_id;

  IF v_owner IS NULL OR v_owner <> v_caller THEN
    RAISE EXCEPTION 'Forbidden: only the project owner can pick a winner';
  END IF;

  -- Approve the chosen one
  UPDATE public.mission_assignments
  SET status = 'approved',
      approved_at = now(),
      reviewed_at = now()
  WHERE id = _assignment_id
    AND status IN ('presented', 'submitted');

  -- Mark all other presented siblings as not_selected
  UPDATE public.mission_assignments
  SET status = 'not_selected',
      reviewed_at = now()
  WHERE mission_id = v_mission_id
    AND id <> _assignment_id
    AND status = 'presented';
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_pick_winner(UUID) TO authenticated;

------------------------------------------------------------------
-- 9) Function: company_reject_round
--    Company rejects ALL presented deliveries for a mission. Resets
--    them to 'submitted' so the admin can curate another round (or
--    cancel after max_present_attempts).
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_reject_round(_mission_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller UUID;
  v_owner UUID;
  v_admin RECORD;
  v_title TEXT;
BEGIN
  v_caller := auth.uid();

  SELECT p.user_id, m.title INTO v_owner, v_title
  FROM public.missions m
  JOIN public.projects p ON p.id = m.project_id
  WHERE m.id = _mission_id;

  IF v_owner IS NULL OR v_owner <> v_caller THEN
    RAISE EXCEPTION 'Forbidden: only the project owner can reject the round';
  END IF;

  -- Reset presented assignments back to submitted so admin can re-curate
  UPDATE public.mission_assignments
  SET status = 'submitted',
      review_note = COALESCE(_reason, review_note)
  WHERE mission_id = _mission_id
    AND status = 'presented';

  -- Notify all admins
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.notify_user(
      v_admin.user_id,
      'curation_rejected',
      'Company rejected the curation round',
      'La empresa rechazó la ronda de curación',
      COALESCE(_reason, v_title),
      COALESCE(_reason, v_title),
      '/admin'
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_reject_round(UUID, TEXT) TO authenticated;

------------------------------------------------------------------
-- 10) Function: archive_mission
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.archive_mission(_mission_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_caller UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller := auth.uid();
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = v_caller AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  UPDATE public.missions
  SET status = 'archived'
  WHERE id = _mission_id;

  -- Optional: any still-active assignment becomes expired so the slot frees
  UPDATE public.mission_assignments
  SET status = 'expired'
  WHERE mission_id = _mission_id
    AND status IN ('assigned', 'in_progress');
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_mission(UUID) TO authenticated;
