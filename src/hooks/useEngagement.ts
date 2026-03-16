import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;

// ─── Track daily activity (upsert today's row) ───
export function useTrackActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: 'course_view' | 'exam_taken' | 'mission_activated' | 'mission_delivered') => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];

      // Try to get existing row
      const { data: existing } = await db
        .from('explorer_daily_activity')
        .select('*')
        .eq('explorer_id', user.id)
        .eq('activity_date', today)
        .maybeSingle();

      const xpMap = {
        course_view: 10,
        exam_taken: 25,
        mission_activated: 15,
        mission_delivered: 50,
      };

      if (existing) {
        const updates: Record<string, number> = {};
        if (type === 'course_view') updates.courses_viewed = (existing.courses_viewed || 0) + 1;
        if (type === 'exam_taken') updates.exams_taken = (existing.exams_taken || 0) + 1;
        if (type === 'mission_activated') updates.missions_activated = (existing.missions_activated || 0) + 1;
        if (type === 'mission_delivered') updates.missions_delivered = (existing.missions_delivered || 0) + 1;
        updates.xp_earned = (existing.xp_earned || 0) + xpMap[type];

        await db
          .from('explorer_daily_activity')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await db.from('explorer_daily_activity').insert({
          explorer_id: user.id,
          activity_date: today,
          courses_viewed: type === 'course_view' ? 1 : 0,
          exams_taken: type === 'exam_taken' ? 1 : 0,
          missions_activated: type === 'mission_activated' ? 1 : 0,
          missions_delivered: type === 'mission_delivered' ? 1 : 0,
          xp_earned: xpMap[type],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

// ─── Get streak + XP + daily missions status ───
export function useEngagementData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['engagement', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get last 60 days of activity
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [activityRes, progressRes, attemptsRes, appsRes] = await Promise.all([
        db.from('explorer_daily_activity')
          .select('*')
          .eq('explorer_id', user.id)
          .gte('activity_date', sixtyDaysAgo.toISOString().split('T')[0])
          .order('activity_date', { ascending: false }),
        db.from('explorer_course_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true),
        db.from('explorer_exam_attempts')
          .select('id')
          .eq('explorer_id', user.id)
          .eq('passed', true),
        db.from('mission_applications')
          .select('id, status')
          .eq('user_id', user.id),
      ]);

      const activities = activityRes.data || [];
      const today = new Date().toISOString().split('T')[0];
      const todayActivity = activities.find((a: any) => a.activity_date === today);

      // Calculate streak
      let streak = 0;
      const activityDates = new Set(activities.map((a: any) => a.activity_date));
      const checkDate = new Date();
      // If no activity today, start from yesterday
      if (!activityDates.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (activityDates.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Total XP
      const totalXP = activities.reduce((sum: number, a: any) => sum + (a.xp_earned || 0), 0);
      // Also add base XP from completed activities
      const baseXP = ((progressRes.data?.length || 0) * 50) +
        ((attemptsRes.data?.length || 0) * 100) +
        ((appsRes.data || []).filter((a: any) => a.status === 'completed' || a.status === 'funds_released').length * 200);

      const completedMissions = (appsRes.data || []).filter((a: any) =>
        a.status === 'completed' || a.status === 'funds_released'
      ).length;
      const activeMissions = (appsRes.data || []).filter((a: any) =>
        a.status === 'pending' || a.status === 'delivered'
      ).length;

      // Daily missions (computed dynamically)
      const dailyMissions = generateDailyMissions(
        todayActivity,
        progressRes.data?.length || 0,
        attemptsRes.data?.length || 0,
        completedMissions,
        activeMissions,
      );

      // Streak milestones
      const streakMilestones = [3, 7, 14, 30, 60];
      const nextMilestone = streakMilestones.find(m => m > streak) || 60;

      // Weekly activity (last 7 days)
      const weekActivity: { date: string; active: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        weekActivity.push({ date: dateStr, active: activityDates.has(dateStr) });
      }

      return {
        streak,
        nextMilestone,
        totalXP: totalXP + baseXP,
        todayXP: todayActivity?.xp_earned || 0,
        dailyMissions,
        weekActivity,
        todayActivity,
        activeDaysThisMonth: activities.filter((a: any) => {
          const d = new Date(a.activity_date);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

interface DailyMission {
  id: string;
  title: string;
  titleEs: string;
  icon: string;
  xp: number;
  completed: boolean;
  action: 'academy' | 'marketplace' | 'passport' | 'exam';
}

function generateDailyMissions(
  todayActivity: any,
  totalCourses: number,
  totalExams: number,
  completedMissions: number,
  activeMissions: number,
): DailyMission[] {
  const missions: DailyMission[] = [
    {
      id: 'learn',
      title: 'Watch a course in Academy',
      titleEs: 'Ver un curso en la Academia',
      icon: '📚',
      xp: 10,
      completed: (todayActivity?.courses_viewed || 0) >= 1,
      action: 'academy',
    },
    {
      id: 'exam',
      title: 'Take a course exam',
      titleEs: 'Tomar un examen de curso',
      icon: '📝',
      xp: 25,
      completed: (todayActivity?.exams_taken || 0) >= 1,
      action: 'exam',
    },
    {
      id: 'mission',
      title: 'Activate a new mission',
      titleEs: 'Activar una nueva misión',
      icon: '🚀',
      xp: 15,
      completed: (todayActivity?.missions_activated || 0) >= 1,
      action: 'marketplace',
    },
    {
      id: 'deliver',
      title: 'Submit a mission delivery',
      titleEs: 'Enviar una entrega de misión',
      icon: '📦',
      xp: 50,
      completed: (todayActivity?.missions_delivered || 0) >= 1,
      action: 'passport',
    },
  ];

  return missions;
}

// ─── Social proof: platform-wide stats ───
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [activityRes, coursesRes, missionsRes, profilesRes] = await Promise.all([
        db.from('explorer_daily_activity')
          .select('id', { count: 'exact', head: true })
          .eq('activity_date', today),
        db.from('explorer_course_progress')
          .select('id', { count: 'exact', head: true })
          .eq('completed', true),
        db.from('mission_applications')
          .select('id', { count: 'exact', head: true })
          .in('status', ['completed', 'funds_released']),
        db.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('account_type', 'explorer'),
      ]);

      return {
        activeToday: activityRes.count || 0,
        totalCoursesCompleted: coursesRes.count || 0,
        totalMissionsCompleted: missionsRes.count || 0,
        totalExplorers: profilesRes.count || 0,
      };
    },
    staleTime: 60_000,
  });
}

// ─── XP Level calculation ───
export function getXPLevel(xp: number): { level: number; name: string; nameEs: string; icon: string; nextLevelXP: number; progress: number } {
  const levels = [
    { level: 1, name: 'Rookie', nameEs: 'Novato', icon: '🌱', threshold: 0 },
    { level: 2, name: 'Explorer', nameEs: 'Explorador', icon: '🧭', threshold: 200 },
    { level: 3, name: 'Specialist', nameEs: 'Especialista', icon: '⚡', threshold: 500 },
    { level: 4, name: 'Elite', nameEs: 'Élite', icon: '🔥', threshold: 1200 },
    { level: 5, name: 'Master', nameEs: 'Maestro', icon: '💎', threshold: 2500 },
    { level: 6, name: 'Legend', nameEs: 'Leyenda', icon: '👑', threshold: 5000 },
  ];

  const current = levels.reduce((lvl, l) => (xp >= l.threshold ? l : lvl), levels[0]);
  const next = levels[levels.indexOf(current) + 1];
  const progress = next
    ? ((xp - current.threshold) / (next.threshold - current.threshold)) * 100
    : 100;

  return {
    ...current,
    nextLevelXP: next?.threshold || current.threshold,
    progress: Math.min(progress, 100),
  };
}
