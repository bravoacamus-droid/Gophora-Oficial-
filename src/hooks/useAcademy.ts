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
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed: boolean;
  completed_at: string | null;
}

export const EXPLORER_LEVELS = [
  { level: 1, name: 'AI Beginner', name_es: 'Principiante IA', minCourses: 0, multiplier: 1.0 },
  { level: 2, name: 'Prompt Explorer', name_es: 'Explorador de Prompts', minCourses: 3, multiplier: 1.5 },
  { level: 3, name: 'Automation Builder', name_es: 'Constructor de Automatización', minCourses: 7, multiplier: 2.0 },
  { level: 4, name: 'AI Operator', name_es: 'Operador de IA', minCourses: 12, multiplier: 2.5 },
  { level: 5, name: 'Mission Architect', name_es: 'Arquitecto de Misiones', minCourses: 18, multiplier: 3.0 },
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

export function useAcademyPaths() {
  return useQuery({
    queryKey: ['academy-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_paths')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as AcademyPath[];
    },
  });
}

export function useAcademyCourses() {
  return useQuery({
    queryKey: ['academy-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_courses')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as AcademyCourse[];
    },
  });
}

export function useAcademyTools() {
  return useQuery({
    queryKey: ['academy-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_tools')
        .select('*');
      if (error) throw error;
      return data as AcademyTool[];
    },
  });
}

export function useCourseProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['course-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('explorer_course_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as CourseProgress[];
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
        const { error } = await supabase
          .from('explorer_course_progress')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,course_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
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
      const { data, error } = await supabase
        .from('academy_shared_prompts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateSharedPrompt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content, category }: { title: string; content: string; category: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('academy_shared_prompts')
        .insert({ user_id: user.id, title, content, category });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-prompts'] });
    },
  });
}
