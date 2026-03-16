import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CourseRecommendation {
  course_id: string;
  reason: string;
  reason_es: string;
  relevance_score: number;
  course: {
    id: string;
    title: string;
    title_es: string | null;
    description: string | null;
    skills_learned: string[] | null;
    skill_level: string;
    category: string | null;
    views_count: number | null;
    rating: number | null;
    instructor_name: string | null;
  };
}

export function useAIRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('recommend-courses');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.recommendations || []) as CourseRecommendation[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}
