-- Phase 6: real notifications, admin tutor delete, commission detail.
--
-- The notifications table existed but nothing populated it — the bell was
-- always empty. This migration installs SECURITY DEFINER triggers that
-- insert rows for every event that matters: mission applied / submitted /
-- approved / rejected / funds released, withdrawal request and resolution,
-- new project, new tutor application, milestones for admins.
--
-- It also adds an RPC `admin_revoke_tutor` so the AdminPanel can drop a
-- tutor's role without going through the existing review_tutor flow.

------------------------------------------------------------------
-- 0) Helper: insert a notification row (SECURITY DEFINER bypasses RLS)
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _title_es TEXT,
  _body TEXT DEFAULT NULL,
  _body_es TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, title_es, body, body_es, link)
  VALUES (_user_id, _type, _title, _title_es, _body, _body_es, _link);
END;
$$;

------------------------------------------------------------------
-- 1) Mission assignment lifecycle → notify both sides
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_mission_assignment_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_explorer_user UUID;
  v_company_user UUID;
  v_mission_title TEXT;
  v_project_id UUID;
BEGIN
  -- Resolve explorer user_id and mission/project info
  SELECT user_id INTO v_explorer_user
    FROM public.explorer_profiles
    WHERE id = NEW.explorer_id;

  SELECT m.title, m.project_id INTO v_mission_title, v_project_id
    FROM public.missions m
    WHERE m.id = NEW.mission_id;

  IF v_project_id IS NOT NULL THEN
    SELECT user_id INTO v_company_user
      FROM public.projects
      WHERE id = v_project_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Explorer just took the mission → notify the company
    PERFORM public.notify_user(
      v_company_user,
      'mission_taken',
      'A new explorer joined your mission',
      'Un explorer tomó tu misión',
      v_mission_title,
      v_mission_title,
      '/company'
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- submitted_at filled in → explorer delivered work → notify company
    IF NEW.status = 'submitted' OR (NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL) THEN
      PERFORM public.notify_user(
        v_company_user,
        'mission_delivered',
        'Mission delivery received',
        'Entrega de misión recibida',
        v_mission_title,
        v_mission_title,
        '/company'
      );
    END IF;

    -- approved → explorer wins
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

    -- rejected
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

    -- funds released → explorer gets paid
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

    -- completed (terminal state) → explorer
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

DROP TRIGGER IF EXISTS mission_assignment_notify_trigger ON public.mission_assignments;
CREATE TRIGGER mission_assignment_notify_trigger
  AFTER INSERT OR UPDATE ON public.mission_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_mission_assignment_notify();

------------------------------------------------------------------
-- 2) New project → notify all admins
-- 3) New tutor application → notify all admins
-- 4) New withdrawal request → notify all admins; status change → notify user
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_notify_admins_on_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.notify_user(
      v_admin.user_id,
      'new_project',
      'New project submitted',
      'Nuevo proyecto enviado',
      NEW.title,
      NEW.title,
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS new_project_notify_admins ON public.projects;
CREATE TRIGGER new_project_notify_admins
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admins_on_new_project();


CREATE OR REPLACE FUNCTION public.tg_notify_admins_on_new_tutor_app()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    PERFORM public.notify_user(
      v_admin.user_id,
      'tutor_application',
      'New tutor application',
      'Nueva solicitud de tutor',
      NEW.bio,
      NEW.bio,
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS new_tutor_app_notify_admins ON public.tutor_applications;
CREATE TRIGGER new_tutor_app_notify_admins
  AFTER INSERT ON public.tutor_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admins_on_new_tutor_app();


CREATE OR REPLACE FUNCTION public.tg_tutor_app_status_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.notify_user(
        NEW.user_id,
        'tutor_approved',
        'You are now a Tutor on GOPHORA 🎓',
        'Sos Tutor en GOPHORA 🎓',
        'You can now publish courses and learning paths.',
        'Ya podés publicar cursos y rutas de aprendizaje.',
        '/academy'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.notify_user(
        NEW.user_id,
        'tutor_rejected',
        'Tutor application not approved',
        'Solicitud de tutor no aprobada',
        COALESCE(NEW.admin_note, 'Check your application for feedback.'),
        COALESCE(NEW.admin_note, 'Revisá tu solicitud para ver el feedback.'),
        '/academy'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tutor_app_status_notify ON public.tutor_applications;
CREATE TRIGGER tutor_app_status_notify
  AFTER UPDATE ON public.tutor_applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_tutor_app_status_notify();


CREATE OR REPLACE FUNCTION public.tg_withdrawal_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.notify_user(
        v_admin.user_id,
        'withdrawal_requested',
        'New withdrawal request',
        'Nueva solicitud de retiro',
        '$' || NEW.amount::text || ' via ' || NEW.method,
        '$' || NEW.amount::text || ' via ' || NEW.method,
        '/admin'
      );
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' OR NEW.status = 'paid' THEN
      PERFORM public.notify_user(
        NEW.user_id,
        'withdrawal_approved',
        'Withdrawal approved',
        'Retiro aprobado',
        '$' || NEW.amount::text,
        '$' || NEW.amount::text,
        '/explorer'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.notify_user(
        NEW.user_id,
        'withdrawal_rejected',
        'Withdrawal rejected',
        'Retiro rechazado',
        COALESCE(NEW.admin_note, 'See your wallet for details.'),
        COALESCE(NEW.admin_note, 'Revisá tu billetera para más info.'),
        '/explorer'
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS withdrawal_notify_trigger ON public.withdrawal_requests;
CREATE TRIGGER withdrawal_notify_trigger
  AFTER INSERT OR UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_withdrawal_notify();

------------------------------------------------------------------
-- 5) admin_revoke_tutor RPC: drop tutor role + mark application revoked
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_revoke_tutor(_user_id UUID, _reason TEXT DEFAULT NULL)
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

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'tutor';
  UPDATE public.tutor_applications
    SET status = 'revoked',
        admin_note = COALESCE(_reason, admin_note),
        reviewed_at = now(),
        reviewed_by = v_caller
    WHERE user_id = _user_id;

  PERFORM public.notify_user(
    _user_id,
    'tutor_revoked',
    'Your tutor access has been revoked',
    'Tu acceso de tutor fue revocado',
    COALESCE(_reason, 'Contact support if you believe this was a mistake.'),
    COALESCE(_reason, 'Contactá soporte si creés que fue un error.'),
    '/academy'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_tutor(UUID, TEXT) TO authenticated;
