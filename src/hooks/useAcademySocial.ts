import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;

// ─── Follow Tutor ───
export function useTutorFollowers(tutorId: string | null) {
  return useQuery({
    queryKey: ['tutor-followers', tutorId],
    queryFn: async () => {
      if (!tutorId) return [];
      const { data, error } = await db
        .from('tutor_followers')
        .select('*')
        .eq('tutor_id', tutorId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tutorId,
  });
}

export function useIsFollowingTutor(tutorId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['following-tutor', tutorId, user?.id],
    queryFn: async () => {
      if (!user || !tutorId) return false;
      const { data, error } = await db
        .from('tutor_followers')
        .select('id')
        .eq('tutor_id', tutorId)
        .eq('explorer_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!tutorId,
  });
}

export function useToggleFollowTutor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tutorId, isFollowing }: { tutorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isFollowing) {
        const { error } = await db.from('tutor_followers').delete()
          .eq('tutor_id', tutorId).eq('explorer_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('tutor_followers').insert({
          tutor_id: tutorId, explorer_id: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { tutorId }) => {
      queryClient.invalidateQueries({ queryKey: ['following-tutor', tutorId] });
      queryClient.invalidateQueries({ queryKey: ['tutor-followers', tutorId] });
      queryClient.invalidateQueries({ queryKey: ['my-followed-tutors'] });
    },
  });
}

export function useMyFollowedTutors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-followed-tutors', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('tutor_followers')
        .select('tutor_id, created_at')
        .eq('explorer_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// ─── Favorite Courses ───
export function useMyFavoriteCourses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-favorite-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('explorer_favorite_courses')
        .select('course_id, created_at')
        .eq('explorer_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useToggleFavoriteCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, isFavorite }: { courseId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isFavorite) {
        const { error } = await db.from('explorer_favorite_courses').delete()
          .eq('explorer_id', user.id).eq('course_id', courseId);
        if (error) throw error;
      } else {
        const { error } = await db.from('explorer_favorite_courses').insert({
          explorer_id: user.id, course_id: courseId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorite-courses'] });
    },
  });
}

// ─── Explorer Skills ───
export function useExplorerSkills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['explorer-skills', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('explorer_skills')
        .select('*')
        .eq('explorer_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useUpsertSkills() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skills: string[]) => {
      if (!user) throw new Error('Not authenticated');
      for (const skill of skills) {
        const { error } = await db
          .from('explorer_skills')
          .upsert({
            explorer_id: user.id,
            skill_name: skill,
            skill_level: 1,
            verified_by_exam: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'explorer_id,skill_name' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explorer-skills'] });
    },
  });
}

// ─── Exam Attempts ───
export function useExamAttempts(courseId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['exam-attempts', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return [];
      const { data, error } = await db
        .from('explorer_exam_attempts')
        .select('*')
        .eq('explorer_id', user.id)
        .eq('course_id', courseId)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!courseId,
  });
}

export function useRecordExamAttempt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, score, passed, attemptNumber }: {
      courseId: string; score: number; passed: boolean; attemptNumber: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db.from('explorer_exam_attempts').insert({
        explorer_id: user.id,
        course_id: courseId,
        score,
        passed,
        attempt_number: attemptNumber,
      });
      if (error) throw error;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts', courseId] });
    },
  });
}

// ─── Certificates ───
export function useMyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('certificates')
        .select('*')
        .eq('explorer_id', user.id)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useIssueCertificate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, courseTitle, tutorName, explorerName }: {
      courseId: string; courseTitle: string; tutorName: string; explorerName: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db.from('certificates').upsert({
        explorer_id: user.id,
        course_id: courseId,
        course_title: courseTitle,
        tutor_name: tutorName,
        explorer_name: explorerName,
      }, { onConflict: 'explorer_id,course_id' }).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
    },
  });
}

export function useVerifyCertificate(code: string | null) {
  return useQuery({
    queryKey: ['verify-certificate', code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await db
        .from('certificates')
        .select('*')
        .eq('certificate_code', code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });
}

// ─── Mission Readiness Score ───
export function calculateMissionReadiness({
  coursesCompleted,
  totalCourses,
  skillsCount,
  avgExamScore,
  missionsCompleted,
}: {
  coursesCompleted: number;
  totalCourses: number;
  skillsCount: number;
  avgExamScore: number;
  missionsCompleted: number;
}) {
  const courseScore = totalCourses > 0 ? (coursesCompleted / Math.max(totalCourses, 1)) * 100 : 0;
  const skillScore = Math.min(skillsCount * 10, 100);
  const examScore = avgExamScore;
  const missionScore = Math.min(missionsCompleted * 5, 100);

  const total = (courseScore * 0.25) + (skillScore * 0.25) + (examScore * 0.25) + (missionScore * 0.25);
  
  let level: string;
  let levelEs: string;
  if (total >= 80) { level = 'Legendary Explorer'; levelEs = 'Explorador Legendario'; }
  else if (total >= 60) { level = 'Elite Explorer'; levelEs = 'Explorador Élite'; }
  else if (total >= 40) { level = 'Advanced Explorer'; levelEs = 'Explorador Avanzado'; }
  else { level = 'Explorer'; levelEs = 'Explorador'; }

  return { score: Math.round(total), level, levelEs };
}

// ─── Tutor Ranking ───
export function calculateTutorScore({
  views,
  completions,
  followers,
  coursesCount,
}: {
  views: number;
  completions: number;
  followers: number;
  coursesCount: number;
}) {
  const score = (views * 0.3) + (completions * 0.4 * 10) + (followers * 0.2 * 20) + (coursesCount * 0.1 * 50);
  
  let level: string;
  let levelEs: string;
  let emoji: string;
  if (score >= 1000) { level = 'Legendary Tutor'; levelEs = 'Tutor Legendario'; emoji = '👑'; }
  else if (score >= 500) { level = 'Elite Tutor'; levelEs = 'Tutor Élite'; emoji = '🏆'; }
  else if (score >= 200) { level = 'Impact Tutor'; levelEs = 'Tutor de Impacto'; emoji = '🚀'; }
  else { level = 'Rising Tutor'; levelEs = 'Tutor Emergente'; emoji = '🌟'; }

  return { score: Math.round(score), level, levelEs, emoji };
}
