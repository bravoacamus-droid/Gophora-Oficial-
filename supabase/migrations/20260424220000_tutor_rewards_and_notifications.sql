-- Tutor rewards + in-app notifications. Closes the economic loop for tutors:
-- (1) notifications table with RLS so any user only sees their own.
-- (2) on_playbook_completed trigger now also INSERTs a notification for the
--     playbook author every time someone finishes their playbook, plus a
--     special "milestone" notification when the count crosses 10/50/100.
-- (3) award_explorer_badges extended with three playbook badges:
--     playbook_creator (any published playbook), playbook_hero (10+
--     completions on any of your playbooks), playbook_legend (50+).

-- ─── notifications table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  title_es text,
  body text,
  body_es text,
  link text,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications"          ON public.notifications;
DROP POLICY IF EXISTS "Users mark own notifications as read" ON public.notifications;

CREATE POLICY "Users see own notifications"
  ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users mark own notifications as read"
  ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- INSERTs always come from SECURITY DEFINER triggers, never from clients.

-- ─── Extend the playbook trigger to send notifications ─────────────────
CREATE OR REPLACE FUNCTION public.on_playbook_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_title text;
  v_count int;
BEGIN
  UPDATE public.prompt_playbooks
    SET completion_count = completion_count + 1,
        updated_at = now()
    WHERE id = NEW.playbook_id
    RETURNING author_id, title, completion_count
    INTO v_author_id, v_title, v_count;

  -- Notify the author for every completion (skip if the author is testing
  -- their own playbook).
  IF v_author_id IS NOT NULL AND v_author_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, title_es, body, body_es, link)
    VALUES (
      v_author_id,
      'playbook_completion',
      'Someone completed your playbook',
      'Alguien completó tu playbook',
      '"' || v_title || '" reached ' || v_count || ' completions.',
      '"' || v_title || '" alcanzó ' || v_count || ' completions.',
      '/academy?tab=teach'
    );

    -- Milestone notifications at 10, 50, 100 completions.
    IF v_count IN (10, 50, 100) THEN
      INSERT INTO public.notifications (user_id, type, title, title_es, body, body_es, link)
      VALUES (
        v_author_id,
        'milestone',
        'Milestone reached!',
        '¡Hito alcanzado!',
        'Your playbook "' || v_title || '" hit ' || v_count || ' completions. New badge unlocked.',
        'Tu playbook "' || v_title || '" alcanzó ' || v_count || ' completions. Nueva insignia desbloqueada.',
        '/academy?tab=teach'
      );
    END IF;
  END IF;

  -- Refresh the author's badges so playbook_creator / playbook_hero /
  -- playbook_legend are awarded right after the milestone is reached.
  IF v_author_id IS NOT NULL THEN
    PERFORM public.award_explorer_badges(v_author_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger is already attached from the previous migration; nothing else to do.

-- ─── Extend award_explorer_badges to include playbook badges ───────────
CREATE OR REPLACE FUNCTION public.award_explorer_badges(_explorer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missions_completed int;
  v_courses_completed int;
  v_exams_passed int;
  v_certificates_count int;
  v_max_skill_level int;
  v_ai_courses int;
  v_design_skills int;
  v_automation_skills int;
  v_is_tutor boolean;
  v_my_playbooks_count int;
  v_max_playbook_completions int;
BEGIN
  IF _explorer_id IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_missions_completed
    FROM mission_assignments
    WHERE explorer_id = _explorer_id AND status IN ('approved', 'completed', 'funds_released');

  SELECT COUNT(*) INTO v_courses_completed
    FROM explorer_course_progress
    WHERE user_id = _explorer_id AND completed = true;

  SELECT COUNT(*) INTO v_exams_passed
    FROM explorer_exam_attempts
    WHERE explorer_id = _explorer_id AND passed = true;

  SELECT COUNT(*) INTO v_certificates_count
    FROM certificates
    WHERE explorer_id = _explorer_id;

  SELECT COALESCE(MAX(skill_level), 0) INTO v_max_skill_level
    FROM explorer_skills
    WHERE explorer_id = _explorer_id;

  SELECT COUNT(*) INTO v_ai_courses
    FROM explorer_course_progress p
    JOIN academy_courses c ON c.id = p.course_id
    WHERE p.user_id = _explorer_id
      AND p.completed = true
      AND (c.category ILIKE '%AI%' OR c.category ILIKE '%IA%' OR c.category ILIKE '%Automation%');

  SELECT COUNT(*) INTO v_design_skills
    FROM explorer_skills
    WHERE explorer_id = _explorer_id AND category ILIKE '%design%';

  SELECT COUNT(*) INTO v_automation_skills
    FROM explorer_skills
    WHERE explorer_id = _explorer_id AND category ILIKE '%automation%';

  SELECT EXISTS(
    SELECT 1 FROM tutor_applications
    WHERE user_id = _explorer_id AND status = 'approved'
  ) INTO v_is_tutor;

  -- New: playbook authoring badges
  SELECT COUNT(*) INTO v_my_playbooks_count
    FROM prompt_playbooks
    WHERE author_id = _explorer_id AND is_published = true;

  SELECT COALESCE(MAX(completion_count), 0) INTO v_max_playbook_completions
    FROM prompt_playbooks
    WHERE author_id = _explorer_id AND is_published = true;

  IF v_missions_completed >= 1 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'first_mission', 'First Mission', 'Primera Misión', '🚀')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_missions_completed >= 10 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'top_performer', 'Top Mission Performer', 'Mejor Ejecutor de Misiones', '🏆')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_ai_courses >= 3 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'ai_explorer', 'AI Explorer', 'Experto IA', '🤖')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_exams_passed >= 5 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'elite_student', 'Elite Tutor Student', 'Estudiante Élite', '🎓')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_certificates_count >= 1 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'certified', 'Certified Explorer', 'Explorador Certificado', '📜')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_max_skill_level >= 5 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'skill_master', 'Skill Master', 'Maestro de Habilidades', '👑')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_automation_skills >= 3 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'automation_specialist', 'Automation Specialist', 'Especialista en Automatización', '⚙️')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_design_skills >= 3 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'design_explorer', 'Design Explorer', 'Explorador de Diseño', '🎨')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_is_tutor THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'tutor', 'Tutor', 'Tutor', '🧑‍🏫')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  -- Playbook authoring badges
  IF v_my_playbooks_count >= 1 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'playbook_creator', 'Playbook Creator', 'Creador de Playbooks', '📘')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_max_playbook_completions >= 10 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'playbook_hero', 'Playbook Hero', 'Héroe de Playbook', '🌟')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;

  IF v_max_playbook_completions >= 50 THEN
    INSERT INTO explorer_badges (explorer_id, badge_key, badge_name, badge_name_es, badge_icon)
      VALUES (_explorer_id, 'playbook_legend', 'Playbook Legend', 'Leyenda de Playbook', '💎')
      ON CONFLICT (explorer_id, badge_key) DO NOTHING;
  END IF;
END;
$$;
