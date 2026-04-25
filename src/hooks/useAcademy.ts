import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AcademyPath {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  icon: string;
  sort_order: number;
}

export interface AcademyCourse {
  id: string;
  path_id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  platform: string;
  external_url: string | null;
  duration_minutes: number;
  skill_level: string;
  language: string;
  skills_learned: string[];
  category: string;
  tool: string | null;
  sort_order: number;
  thumbnail_url: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  views_count: number;
  rating: number;
  rating_count: number;
  course_status: string;
  submitted_by: string | null;
  featured: boolean;
}

export interface AcademyTool {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  category: string;
  url: string | null;
  icon: string;
  use_cases: string[];
  use_cases_es: string[];
  relevant_skills?: string[] | null;
  quick_start?: string | null;
  quick_start_es?: string | null;
}

export interface ExamQuestion {
  id: string;
  course_id: string;
  question: string;
  question_es: string | null;
  options: string[];
  options_es: string[];
  correct_index: number;
  sort_order: number;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface TutorApplication {
  id: string;
  user_id: string;
  bio: string;
  expertise: string[];
  portfolio_url: string | null;
  status: string;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
}

export const EXPLORER_LEVELS = [
  { level: 1, name: 'Rookie Explorer', name_es: 'Explorador Novato', minCourses: 0, multiplier: 1.0 },
  { level: 2, name: 'Mission Specialist', name_es: 'Especialista de Misiones', minCourses: 3, multiplier: 1.5 },
  { level: 3, name: 'Automation Operator', name_es: 'Operador de Automatización', minCourses: 7, multiplier: 2.0 },
  { level: 4, name: 'AI Navigator', name_es: 'Navegador de IA', minCourses: 12, multiplier: 2.5 },
  { level: 5, name: 'Elite Explorer', name_es: 'Explorador Élite', minCourses: 18, multiplier: 3.0 },
];

export function getExplorerLevel(completedCourses: number) {
  let current = EXPLORER_LEVELS[0];
  for (const level of EXPLORER_LEVELS) {
    if (completedCourses >= level.minCourses) current = level;
  }
  const nextLevel = EXPLORER_LEVELS.find(l => l.level === current.level + 1);
  const progressToNext = nextLevel
    ? ((completedCourses - current.minCourses) / (nextLevel.minCourses - current.minCourses)) * 100
    : 100;
  return { ...current, progressToNext: Math.min(progressToNext, 100), nextLevel };
}

const db = supabase as any;

export function useAcademyPaths() {
  return useQuery({
    queryKey: ['academy-paths'],
    queryFn: async () => {
      const { data, error } = await db
        .from('academy_paths')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as AcademyPath[];
    },
  });
}

export function useAcademyCourses() {
  return useQuery({
    queryKey: ['academy-courses'],
    queryFn: async () => {
      const { data, error } = await db
        .from('academy_courses')
        .select('*')
        .eq('course_status', 'published')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as AcademyCourse[];
    },
  });
}

export function useAllAcademyCourses() {
  return useQuery({
    queryKey: ['academy-courses-all'],
    queryFn: async () => {
      const { data, error } = await db
        .from('academy_courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AcademyCourse[];
    },
  });
}

export function useAcademyTools() {
  return useQuery({
    queryKey: ['academy-tools'],
    queryFn: async () => {
      const { data, error } = await db
        .from('academy_tools')
        .select('*');
      if (error) throw error;
      return (data || []) as AcademyTool[];
    },
  });
}

// Returns up to 3 tools whose `relevant_skills` array contains the given mission
// skill, so the Explorer can see "Herramientas recomendadas" inside the mission
// detail dialog. `skill` matches the projects.category enum (Marketing, Web
// Development, Design, Data, Research, Operations).
export function useToolsForSkill(skill: string | null | undefined) {
  return useQuery({
    queryKey: ['tools-for-skill', skill],
    queryFn: async () => {
      if (!skill) return [];
      const { data, error } = await db
        .from('academy_tools')
        .select('*')
        .contains('relevant_skills', [skill])
        .limit(3);
      if (error) throw error;
      return (data || []) as AcademyTool[];
    },
    enabled: !!skill,
    staleTime: 5 * 60 * 1000,
  });
}

// Fire-and-forget log of when an explorer interacts with a tool. We never
// block the UI on this — if the insert fails (RLS, network) the user still
// gets to use the tool. Used by both the Toolkit cards and the recommended
// tools surfaced inside a mission.
export function useTrackToolUsage() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ toolId, missionId }: { toolId: string; missionId?: string | null }) => {
      if (!user) return;
      await db.from('tool_usage').insert({
        user_id: user.id,
        tool_id: toolId,
        mission_id: missionId || null,
      });
    },
  });
}

export function useCourseProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['course-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('explorer_course_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as CourseProgress[];
    },
    enabled: !!user,
  });
}

export function useToggleCourseCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, completed }: { courseId: string; completed: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (completed) {
        const { error } = await db
          .from('explorer_course_progress')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,course_id' });
        if (error) throw error;
      } else {
        const { error } = await db
          .from('explorer_course_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
    },
  });
}

export function useSharedPrompts() {
  return useQuery({
    queryKey: ['shared-prompts'],
    queryFn: async () => {
      const { data, error } = await db
        .from('academy_shared_prompts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useCreateSharedPrompt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content, category }: { title: string; content: string; category: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('academy_shared_prompts')
        .insert({ user_id: user.id, title, content, category });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-prompts'] });
    },
  });
}

export function useTutorApplication() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tutor-application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await db
        .from('tutor_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as TutorApplication | null;
    },
    enabled: !!user,
  });
}

export function useSubmitTutorApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bio, expertise, portfolio_url }: { bio: string; expertise: string[]; portfolio_url?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('tutor_applications')
        .insert({ user_id: user.id, bio, expertise, portfolio_url });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-application'] });
    },
  });
}

export function useSubmitCourseAsTutor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      course: Partial<AcademyCourse> & { title: string; path_id: string };
      examQuestions?: Array<{ question: string; question_es: string; options: string[]; options_es: string[]; correct_index: number }>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db
        .from('academy_courses')
        .insert({
          ...payload.course,
          submitted_by: user.id,
          course_status: 'pending_review',
        })
        .select('id')
        .single();
      if (error) throw error;

      if (payload.examQuestions && payload.examQuestions.length > 0 && data?.id) {
        const questions = payload.examQuestions.map((q: any, i: number) => ({
          course_id: data.id,
          question: q.question,
          question_es: q.question_es || null,
          options: q.options,
          options_es: q.options_es || [],
          correct_index: q.correct_index,
          sort_order: i,
        }));
        const { error: qError } = await db.from('course_exam_questions').insert(questions);
        if (qError) throw qError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-courses-all'] });
    },
  });
}

export function useCourseExamQuestions(courseId: string | null) {
  return useQuery({
    queryKey: ['course-exam-questions', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await db
        .from('course_exam_questions')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        options_es: typeof q.options_es === 'string' ? JSON.parse(q.options_es) : q.options_es,
      })) as ExamQuestion[];
    },
    enabled: !!courseId,
  });
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await db.rpc('increment_course_views', { _course_id: courseId });
      if (error) {
        await db
          .from('academy_courses')
          .update({ views_count: db.raw('views_count + 1') })
          .eq('id', courseId);
      }
    },
  });
}
