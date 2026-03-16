import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;

// ─── Explorer Skills (extended) ───
export function useExplorerSkillsExtended(explorerId?: string | null) {
  const { user } = useAuth();
  const id = explorerId || user?.id;
  return useQuery({
    queryKey: ['passport-skills', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await db
        .from('explorer_skills')
        .select('*')
        .eq('explorer_id', id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });
}

// ─── Explorer Badges ───
export function useExplorerBadges(explorerId?: string | null) {
  const { user } = useAuth();
  const id = explorerId || user?.id;
  return useQuery({
    queryKey: ['passport-badges', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await db
        .from('explorer_badges')
        .select('*')
        .eq('explorer_id', id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });
}

export function useAwardBadge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ badgeKey, badgeName, badgeNameEs, badgeIcon }: {
      badgeKey: string; badgeName: string; badgeNameEs?: string; badgeIcon?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('explorer_badges').upsert({
        explorer_id: user.id,
        badge_key: badgeKey,
        badge_name: badgeName,
        badge_name_es: badgeNameEs || null,
        badge_icon: badgeIcon || '🏅',
      }, { onConflict: 'explorer_id,badge_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passport-badges'] });
    },
  });
}

// ─── Passport Stats ───
export function usePassportStats(explorerId?: string | null) {
  const { user } = useAuth();
  const id = explorerId || user?.id;
  return useQuery({
    queryKey: ['passport-stats', id],
    queryFn: async () => {
      if (!id) return null;

      // Parallel queries
      const [skillsRes, badgesRes, certsRes, progressRes, attemptsRes, appsRes, profileRes] = await Promise.all([
        db.from('explorer_skills').select('*').eq('explorer_id', id),
        db.from('explorer_badges').select('*').eq('explorer_id', id),
        db.from('certificates').select('*').eq('explorer_id', id),
        db.from('explorer_course_progress').select('*').eq('user_id', id).eq('completed', true),
        db.from('explorer_exam_attempts').select('*').eq('explorer_id', id).eq('passed', true),
        db.from('mission_applications').select('*').eq('user_id', id).in('status', ['completed', 'funds_released']),
        db.from('profiles').select('full_name, username, avatar_url, bio, account_type').eq('id', id).single(),
      ]);

      const skills = skillsRes.data || [];
      const badges = badgesRes.data || [];
      const certificates = certsRes.data || [];
      const coursesCompleted = progressRes.data || [];
      const examsPassed = attemptsRes.data || [];
      const missionsCompleted = appsRes.data || [];
      const profile = profileRes.data;

      // Avg exam score
      const avgExamScore = examsPassed.length > 0
        ? examsPassed.reduce((s: number, e: any) => s + (e.score || 0), 0) / examsPassed.length
        : 0;

      // Mission readiness (equal weights)
      const courseScore = Math.min((coursesCompleted.length / Math.max(1, 1)) * 20, 100);
      const skillScore = Math.min(skills.length * 15, 100);
      const examScore = avgExamScore;
      const missionScore = Math.min(missionsCompleted.length * 10, 100);
      const readinessScore = Math.round(
        (courseScore * 0.25) + (skillScore * 0.25) + (examScore * 0.25) + (missionScore * 0.25)
      );

      // Level
      let level = 'Explorer';
      let levelEs = 'Explorador';
      if (readinessScore >= 80) { level = 'Legendary Explorer'; levelEs = 'Explorador Legendario'; }
      else if (readinessScore >= 60) { level = 'Elite Explorer'; levelEs = 'Explorador Élite'; }
      else if (readinessScore >= 40) { level = 'Advanced Explorer'; levelEs = 'Explorador Avanzado'; }

      // Skill categories
      const categories: Record<string, any[]> = {};
      skills.forEach((s: any) => {
        const cat = s.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s);
      });

      return {
        profile,
        skills,
        badges,
        certificates,
        coursesCompleted: coursesCompleted.length,
        examsPassed: examsPassed.length,
        missionsCompleted: missionsCompleted.length,
        avgExamScore: Math.round(avgExamScore),
        readinessScore,
        level,
        levelEs,
        categories,
        totalEarnings: missionsCompleted.reduce((s: number, m: any) => s + Number(m.reward || 0), 0),
      };
    },
    enabled: !!id,
  });
}

// ─── Skill level labels ───
export const SKILL_LEVELS: Record<number, { en: string; es: string }> = {
  1: { en: 'Beginner', es: 'Principiante' },
  2: { en: 'Intermediate', es: 'Intermedio' },
  3: { en: 'Advanced', es: 'Avanzado' },
  4: { en: 'Expert', es: 'Experto' },
  5: { en: 'Master', es: 'Maestro' },
};

export const SKILL_CATEGORIES = [
  'AI Tools', 'Automation', 'Design', 'Content Creation', 'Data Analysis', 'Marketing', 'Development',
];

export const BADGE_DEFINITIONS = [
  { key: 'ai_explorer', name: 'AI Explorer', nameEs: 'Explorador IA', icon: '🤖', condition: 'Complete 3 AI courses' },
  { key: 'automation_specialist', name: 'Automation Specialist', nameEs: 'Especialista en Automatización', icon: '⚙️', condition: '3 automation skills' },
  { key: 'design_explorer', name: 'Design Explorer', nameEs: 'Explorador de Diseño', icon: '🎨', condition: '3 design skills' },
  { key: 'top_performer', name: 'Top Mission Performer', nameEs: 'Mejor Ejecutor de Misiones', icon: '🏆', condition: '10 missions completed' },
  { key: 'elite_student', name: 'Elite Tutor Student', nameEs: 'Estudiante Élite', icon: '🎓', condition: '5 exams passed' },
  { key: 'first_mission', name: 'First Mission', nameEs: 'Primera Misión', icon: '🚀', condition: 'Complete first mission' },
  { key: 'skill_master', name: 'Skill Master', nameEs: 'Maestro de Habilidades', icon: '👑', condition: 'Any skill at level 5' },
  { key: 'certified', name: 'Certified Explorer', nameEs: 'Explorador Certificado', icon: '📜', condition: 'Earn first certificate' },
];
