-- award_explorer_badges(_explorer_id uuid)
-- Idempotently grants every badge the explorer qualifies for based on their
-- real stats (missions completed, courses finished, exams passed, certificates,
-- skills, tutor approval). Safe to call repeatedly — ON CONFLICT DO NOTHING.
--
-- Called from the Explorer dashboard on mount and after major events (mission
-- approved, course completed, etc.) so the passport stays in sync automatically.

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
BEGIN
  IF _explorer_id IS NULL THEN RETURN; END IF;

  -- assignment_status enum: assigned, in_progress, submitted, approved, rejected, completed, funds_released
  -- "Done successfully" states are approved/completed/funds_released (no "paid").
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_explorer_badges(uuid) TO authenticated;
