import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  title_es: string | null;
  body: string | null;
  body_es: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// Last 30 notifications for the current user, newest first.
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
    enabled: !!user,
    // Refetch every 60s while the tab is open so the bell badge stays current
    // without requiring a full page reload after a milestone fires.
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await db
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      if (!user) return;
      // If ids omitted, mark all of the user's unread notifications as read.
      let q = db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id);
      if (ids && ids.length > 0) {
        q = q.in('id', ids);
      } else {
        q = q.is('read_at', null);
      }
      await q;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
