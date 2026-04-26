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
  author_id?: string | null;
  is_published?: boolean;
  authorName?: string | null;
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
  delivery_mode?: 'live' | 'recorded';
  live_at?: string | null;
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

// Same as useAcademyPaths but each row gets `authorName` resolved from
// the profiles table (or "GOPHORA Team" when author_id is NULL — those
// are admin-curated paths). Used by the Rutas tab so explorers can see
// who curated each path.
export function usePathsWithAuthors() {
  return useQuery({
    queryKey: ['paths-with-authors'],
    queryFn: async () => {
      const { data: paths, error } = await db
        .from('academy_paths')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      const list = (paths || []) as AcademyPath[];
      const authorIds = [...new Set(list.map((p) => p.author_id).filter(Boolean) as string[])];
      let nameMap = new Map<string, string>();
      if (authorIds.length > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select('id, full_name, username')
          .in('id', authorIds);
        nameMap = new Map(
          (profiles || []).map((p: any) => [p.id, p.full_name || p.username || 'Tutor'])
        );
      }
      return list.map((p) => ({
        ...p,
        authorName: p.author_id ? (nameMap.get(p.author_id) || 'Tutor') : 'GOPHORA Team',
      })) as AcademyPath[];
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

// ─── Path enrollments ───────────────────────────────────────────────────

export interface PathEnrollment {
  id: string;
  user_id: string;
  path_id: string;
  started_at: string;
  completed_at: string | null;
}

export function useMyPathEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['path-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('path_enrollments')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as PathEnrollment[];
    },
    enabled: !!user,
  });
}

export function useEnrollInPath() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('path_enrollments')
        .insert({ user_id: user.id, path_id: pathId });
      if (error && !String(error.message || '').includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['path-enrollments'] });
    },
  });
}

// ─── Tutor-authored paths ───────────────────────────────────────────────

export function useMyPaths() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-paths', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('academy_paths')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AcademyPath[];
    },
    enabled: !!user,
  });
}

// Creates a learning path and reassigns the selected courses to it.
// Tutors can only include their OWN courses (RLS on academy_courses
// already enforces that — we just pre-filter the UI to avoid surprises).
export function useCreatePath() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      icon?: string;
      courseIds: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (!payload.title.trim()) throw new Error('Falta el título');
      if (!payload.courseIds || payload.courseIds.length < 2) {
        throw new Error('Una ruta necesita al menos 2 cursos.');
      }

      const { data: path, error: pathErr } = await db
        .from('academy_paths')
        .insert({
          author_id: user.id,
          title: payload.title.trim(),
          description: payload.description?.trim() || null,
          icon: payload.icon || 'BookOpen',
          is_published: true,
        })
        .select('id')
        .single();
      if (pathErr) throw pathErr;

      const { error: courseErr } = await db
        .from('academy_courses')
        .update({ path_id: path.id })
        .in('id', payload.courseIds);
      if (courseErr) throw courseErr;

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-paths'] });
      queryClient.invalidateQueries({ queryKey: ['my-paths'] });
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-courses-all'] });
    },
  });
}

export function useDeletePath() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('academy_paths')
        .delete()
        .eq('id', pathId)
        .eq('author_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-paths'] });
      queryClient.invalidateQueries({ queryKey: ['my-paths'] });
    },
  });
}

// ─── Polymorphic favorites (paths + playbooks) ──────────────────────────
// Course favorites still live in explorer_favorite_courses for backwards
// compatibility — useMyFavoriteCourses + useToggleFavoriteCourse handle
// those. This is for the new types.

export type FavoriteItemType = 'path' | 'playbook';

export function useMyFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [] as Array<{ item_type: FavoriteItemType; item_id: string }>;
      const { data, error } = await db
        .from('favorites')
        .select('item_type, item_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as Array<{ item_type: FavoriteItemType; item_id: string }>;
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemType, itemId, isFavorite }: { itemType: FavoriteItemType; itemId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isFavorite) {
        const { error } = await db
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', itemType)
          .eq('item_id', itemId);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('favorites')
          .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
        if (error && !String(error.message || '').includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Top open marketplace skills the user is NOT yet skilled in. Used by the
// Para ti tab as a "skill gap" widget so explorers know what to learn next.
export function useSkillGap() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['skill-gap', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [{ data: missions }, { data: mySkills }] = await Promise.all([
        db.from('missions').select('skill').eq('status', 'approved').limit(200),
        db.from('explorer_skills').select('skill_name, category').eq('explorer_id', user.id),
      ]);
      const ownedNames = new Set<string>();
      (mySkills || []).forEach((s: any) => {
        if (s.skill_name) ownedNames.add(String(s.skill_name).toLowerCase());
        if (s.category) ownedNames.add(String(s.category).toLowerCase());
      });
      const counts = new Map<string, number>();
      (missions || []).forEach((m: any) => {
        const k = String(m.skill || '').trim();
        if (!k) return;
        if (ownedNames.has(k.toLowerCase())) return;
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      const ranked = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, openMissions]) => ({ skill, openMissions }));
      return ranked;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Top playbooks for the user, ranked by approval_rate then total_uses,
// optionally filtered by skill match against the user's profile skills.
export function useRecommendedPlaybooks(limit: number = 4) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recommended-playbooks', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const [{ data: playbooks }, { data: profile }] = await Promise.all([
        db.from('prompt_playbooks').select('*').eq('is_published', true),
        db.from('explorer_profiles').select('skills').eq('user_id', user.id).maybeSingle(),
      ]);
      const list = (playbooks || []) as any[];
      const profileSkills: string[] = Array.isArray(profile?.skills) ? (profile!.skills as string[]) : [];
      const lower = profileSkills.map((s) => s.toLowerCase());
      list.sort((a: any, b: any) => {
        const aMatch = lower.some((s) => (a.skill || '').toLowerCase().includes(s) || s.includes((a.skill || '').toLowerCase()));
        const bMatch = lower.some((s) => (b.skill || '').toLowerCase().includes(s) || s.includes((b.skill || '').toLowerCase()));
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return (b.completion_count || 0) - (a.completion_count || 0);
      });
      return list.slice(0, limit);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Suggests learning paths the user is NOT enrolled in yet, sorted by
// completion_count desc.
export function useRecommendedPaths(limit: number = 3) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recommended-paths', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const [{ data: paths }, { data: enrollments }] = await Promise.all([
        db.from('academy_paths').select('*').eq('is_published', true),
        db.from('path_enrollments').select('path_id').eq('user_id', user.id),
      ]);
      const enrolled = new Set((enrollments || []).map((e: any) => e.path_id));
      const list = (paths || []) as AcademyPath[];
      const filtered = list.filter((p) => !enrolled.has(p.id));
      // We don't track per-path popularity directly; rely on sort_order +
      // recency as a soft proxy. Cheap to compute, deterministic.
      filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return filtered.slice(0, limit);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
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

export interface SharedPromptStats {
  prompt_id: string;
  total_uses: number;
  copy_count: number;
  mission_uses: number;
  approved_uses: number;
  approval_rate: number | null;
}

export interface SharedPromptWithStats {
  id: string;
  title: string;
  content: string;
  category: string | null;
  skill: string | null;
  tool_id: string | null;
  is_official: boolean;
  user_id: string | null;
  created_at: string;
  // joined fields
  toolName: string | null;
  toolUrl: string | null;
  toolIcon: string | null;
  stats: SharedPromptStats | null;
}

// Returns prompts joined with their tool info and battle-tested stats. The
// stats view is computed live from prompt_usage joined to mission_assignments.
export function useSharedPromptsWithStats() {
  return useQuery({
    queryKey: ['shared-prompts-with-stats'],
    queryFn: async () => {
      const [{ data: prompts, error: pErr }, { data: stats }, { data: tools }] = await Promise.all([
        db.from('academy_shared_prompts').select('*').order('created_at', { ascending: false }).limit(120),
        db.from('shared_prompt_stats').select('*'),
        db.from('academy_tools').select('id, name, name_es, url, icon'),
      ]);
      if (pErr) throw pErr;
      const statsMap = new Map<string, SharedPromptStats>((stats || []).map((s: any) => [s.prompt_id, s]));
      const toolMap = new Map<string, any>((tools || []).map((t: any) => [t.id, t]));
      return (prompts || []).map((p: any): SharedPromptWithStats => {
        const tool = p.tool_id ? toolMap.get(p.tool_id) : null;
        return {
          ...p,
          toolName: tool?.name || null,
          toolUrl: tool?.url || null,
          toolIcon: tool?.icon || null,
          stats: statsMap.get(p.id) || null,
        };
      });
    },
  });
}

// Backwards-compat: still used in a few places; just calls the new one without
// the joined data for components that don't need stats.
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
    mutationFn: async ({
      title, content, category, skill, toolId,
    }: {
      title: string; content: string; category: string;
      skill?: string | null; toolId?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('academy_shared_prompts')
        .insert({
          user_id: user.id,
          title,
          content,
          category,
          skill: skill || null,
          tool_id: toolId || null,
          is_official: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['shared-prompts-with-stats'] });
    },
  });
}

// Logs a "Copy & Open" interaction. mission_assignment_id is passed when the
// explorer uses the prompt while looking at one of their missions, so the
// stats view can compute approval-rate.
export function useTrackPromptUse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promptId, missionAssignmentId }: { promptId: string; missionAssignmentId?: string | null }) => {
      if (!user) return;
      await db.from('prompt_usage').insert({
        prompt_id: promptId,
        user_id: user.id,
        mission_assignment_id: missionAssignmentId || null,
      });
    },
    onSuccess: () => {
      // Refresh stats so the badge updates without a full reload.
      queryClient.invalidateQueries({ queryKey: ['shared-prompts-with-stats'] });
      queryClient.invalidateQueries({ queryKey: ['prompts-for-skill'] });
    },
  });
}

// Free-text search across the prompt library using the Postgres tsvector
// + GIN index. Falls back to ILIKE inside the search_prompts function so a
// single weird token still returns something rather than an empty list.
// Pass an optional skill to constrain to that mission category.
export function useSearchPrompts(query: string, skill?: string | null) {
  return useQuery({
    queryKey: ['search-prompts', query, skill],
    queryFn: async () => {
      const trimmed = query.trim();
      if (!trimmed) return [];
      const { data: matches, error } = await db.rpc('search_prompts', {
        _query: trimmed,
        _skill: skill || null,
      });
      if (error) throw error;
      const ids = (matches || []).map((m: any) => m.id);
      if (ids.length === 0) return [];

      const [{ data: prompts }, { data: stats }, { data: tools }] = await Promise.all([
        db.from('academy_shared_prompts').select('*').in('id', ids),
        db.from('shared_prompt_stats').select('*').in('prompt_id', ids),
        db.from('academy_tools').select('id, name, name_es, url, icon'),
      ]);
      const statsMap = new Map<string, SharedPromptStats>((stats || []).map((s: any) => [s.prompt_id, s]));
      const toolMap = new Map<string, any>((tools || []).map((t: any) => [t.id, t]));
      const orderById = new Map<string, number>(ids.map((id: string, i: number) => [id, i]));
      const enriched: SharedPromptWithStats[] = (prompts || []).map((p: any) => {
        const tool = p.tool_id ? toolMap.get(p.tool_id) : null;
        return {
          ...p,
          toolName: tool?.name || null,
          toolUrl: tool?.url || null,
          toolIcon: tool?.icon || null,
          stats: statsMap.get(p.id) || null,
        };
      });
      // Preserve the rank order returned by the search function.
      enriched.sort((a, b) => (orderById.get(a.id) ?? 99) - (orderById.get(b.id) ?? 99));
      return enriched;
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}

// Improves a draft prompt by sending it through the improve-prompt Edge
// Function. Returns { improved, reason } so the UI can show a side-by-side
// comparison and let the user pick which version to publish.
export function useImprovePrompt() {
  return useMutation({
    mutationFn: async ({ draft, skill, language }: { draft: string; skill?: string | null; language?: 'es' | 'en' }) => {
      const { data, error } = await supabase.functions.invoke('improve-prompt', {
        body: { draft, skill: skill || null, language: language || 'es' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { improved: string; reason: string };
    },
  });
}

// Top prompts for a given mission skill, sorted by approval_rate desc then
// total_uses desc. Used in ExplorerDashboard mission detail to surface the
// 3 most battle-tested prompts for the skill.
export function usePromptsForSkill(skill: string | null | undefined) {
  return useQuery({
    queryKey: ['prompts-for-skill', skill],
    queryFn: async () => {
      if (!skill) return [];
      const [{ data: prompts }, { data: stats }, { data: tools }] = await Promise.all([
        db.from('academy_shared_prompts').select('*').eq('skill', skill).limit(40),
        db.from('shared_prompt_stats').select('*'),
        db.from('academy_tools').select('id, name, name_es, url, icon'),
      ]);
      const statsMap = new Map<string, SharedPromptStats>((stats || []).map((s: any) => [s.prompt_id, s]));
      const toolMap = new Map<string, any>((tools || []).map((t: any) => [t.id, t]));
      const enriched: SharedPromptWithStats[] = (prompts || []).map((p: any) => {
        const tool = p.tool_id ? toolMap.get(p.tool_id) : null;
        return {
          ...p,
          toolName: tool?.name || null,
          toolUrl: tool?.url || null,
          toolIcon: tool?.icon || null,
          stats: statsMap.get(p.id) || null,
        };
      });
      enriched.sort((a, b) => {
        const aRate = a.stats?.approval_rate ?? -1;
        const bRate = b.stats?.approval_rate ?? -1;
        if (aRate !== bRate) return bRate - aRate;
        const aUses = a.stats?.total_uses || 0;
        const bUses = b.stats?.total_uses || 0;
        if (aUses !== bUses) return bUses - aUses;
        if (a.is_official !== b.is_official) return a.is_official ? -1 : 1;
        return 0;
      });
      return enriched.slice(0, 3);
    },
    enabled: !!skill,
    staleTime: 2 * 60 * 1000,
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
      const insertPayload: any = {
        ...payload.course,
        submitted_by: user.id,
        course_status: 'pending_review',
      };
      // Strip an empty live_at so Postgres receives NULL instead of "".
      if (insertPayload.live_at === '' || insertPayload.live_at === undefined) {
        insertPayload.live_at = null;
      }
      const { data, error } = await db
        .from('academy_courses')
        .insert(insertPayload)
        .select('id')
        .single();
      if (error) throw error;

      if (payload.examQuestions && payload.examQuestions.length > 0 && data?.id) {
        // Mirror EN → ES when the tutor didn't fill the ES side. The form
        // currently exposes only one input row per option, so options_es
        // would otherwise be saved as ['', '', '', ''] and the bilingual
        // exam UI would render blank A/B/C/D buttons.
        const questions = payload.examQuestions.map((q: any, i: number) => {
          const en = q.question?.trim() || '';
          const es = q.question_es?.trim() || '';
          const enOpts = Array.isArray(q.options) ? q.options : [];
          const esOptsRaw = Array.isArray(q.options_es) ? q.options_es : [];
          const esHasContent = esOptsRaw.some((s: any) => typeof s === 'string' && s.trim().length > 0);
          return {
            course_id: data.id,
            question: en || es,
            question_es: es || en || null,
            options: enOpts,
            options_es: esHasContent ? esOptsRaw : enOpts,
            correct_index: q.correct_index,
            sort_order: i,
          };
        });
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

// ─── Playbooks (Idea 2) ─────────────────────────────────────────────────

export interface PromptPlaybook {
  id: string;
  author_id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  skill: string | null;
  prompt_ids: string[];
  thumbnail_url: string | null;
  is_published: boolean;
  completion_count: number;
  created_at: string;
  authorName?: string | null;
  myCompletion?: { id: string; completed_at: string } | null;
}

// Returns all published playbooks (or all if user is admin/author) joined
// with the author's display name and the current user's completion record
// (if any).
export function usePlaybooks(skill?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['playbooks', skill || 'all'],
    queryFn: async () => {
      let query = db.from('prompt_playbooks').select('*').order('completion_count', { ascending: false });
      if (skill) query = query.eq('skill', skill);
      const { data: playbooks, error } = await query;
      if (error) throw error;
      const list = (playbooks || []) as PromptPlaybook[];
      if (list.length === 0) return [];

      const authorIds = [...new Set(list.map((p) => p.author_id).filter(Boolean))];
      const { data: profiles } = await db
        .from('profiles')
        .select('id, full_name, username')
        .in('id', authorIds);
      const nameMap = new Map<string, string>(
        (profiles || []).map((p: any) => [p.id, p.full_name || p.username || 'Tutor'])
      );

      let myCompletions: any[] = [];
      if (user) {
        const { data } = await db
          .from('playbook_completions')
          .select('id, playbook_id, completed_at')
          .eq('user_id', user.id);
        myCompletions = data || [];
      }
      const completionMap = new Map<string, { id: string; completed_at: string }>(
        myCompletions.map((c: any) => [c.playbook_id, { id: c.id, completed_at: c.completed_at }])
      );

      return list.map((p) => ({
        ...p,
        authorName: nameMap.get(p.author_id) || 'Tutor',
        myCompletion: completionMap.get(p.id) || null,
      })) as PromptPlaybook[];
    },
  });
}

// Lists ONLY the playbooks authored by the current user — used in the
// tutor's Enseñar tab.
export function useMyPlaybooks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-playbooks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('prompt_playbooks')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PromptPlaybook[];
    },
    enabled: !!user,
  });
}

export function useCreatePlaybook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      skill?: string | null;
      prompt_ids: string[];
      thumbnail_url?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (!payload.prompt_ids || payload.prompt_ids.length < 2) {
        throw new Error('Un playbook necesita al menos 2 prompts.');
      }
      const { data, error } = await db
        .from('prompt_playbooks')
        .insert({
          author_id: user.id,
          title: payload.title,
          description: payload.description || null,
          skill: payload.skill || null,
          prompt_ids: payload.prompt_ids,
          thumbnail_url: payload.thumbnail_url || null,
          is_published: true,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      queryClient.invalidateQueries({ queryKey: ['my-playbooks'] });
    },
  });
}

export function useDeletePlaybook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playbookId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('prompt_playbooks')
        .delete()
        .eq('id', playbookId)
        .eq('author_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      queryClient.invalidateQueries({ queryKey: ['my-playbooks'] });
    },
  });
}

export function useCompletePlaybook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playbookId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('playbook_completions')
        .insert({ user_id: user.id, playbook_id: playbookId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
}
