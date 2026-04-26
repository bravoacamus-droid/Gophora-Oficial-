import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrackActivity } from '@/hooks/useEngagement';
import { toast } from 'sonner';

const MAX_EXPLORERS_PER_MISSION = 10;

interface ActivateOptions {
  onSuccess?: () => void;
}

export function useActivateMission() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const trackActivity = useTrackActivity();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const activate = async (missionId: string, opts?: ActivateOptions): Promise<{ success: boolean }> => {
    if (!user) {
      toast.error(isEs ? 'Debes iniciar sesión para tomar una misión' : 'You must log in to take a mission');
      return { success: false };
    }

    setActivatingId(missionId);
    try {
      const { data: expProfile, error: profileError } = await (supabase
        .from('explorer_profiles' as any)
        .select('id')
        .eq('user_id', user.id)
        .single() as any);
      if (profileError || !expProfile) {
        throw new Error(isEs ? 'Completa tu onboarding primero' : 'Complete your onboarding first');
      }

      const { count, error: countError } = await (supabase
        .from('mission_assignments' as any)
        .select('*', { count: 'exact', head: true })
        .eq('mission_id', missionId) as any);
      if (countError) throw countError;

      const { data: mission, error: missionError } = await (supabase
        .from('missions' as any)
        .select('status')
        .eq('id', missionId)
        .single() as any);
      if (missionError) throw missionError;

      if (mission.status !== 'approved' && mission.status !== 'open') {
        throw new Error(isEs ? 'Esta misión ya no está disponible' : 'This mission is no longer available');
      }
      if ((count || 0) >= MAX_EXPLORERS_PER_MISSION) {
        throw new Error(isEs ? 'Esta misión ya alcanzó el límite de exploradores' : 'This mission reached its explorer limit');
      }

      const { error: assignError } = await (supabase.from('mission_assignments' as any).insert({
        mission_id: missionId,
        explorer_id: expProfile.id,
        status: 'assigned',
      }) as any);
      if (assignError) throw assignError;

      if ((count || 0) + 1 === MAX_EXPLORERS_PER_MISSION) {
        await (supabase.from('missions' as any).update({ status: 'assigned' as any }).eq('id', missionId) as any);
      }

      trackActivity.mutate('mission_activated');
      toast.success(isEs ? '¡Misión tomada con éxito!' : 'Mission taken successfully!');
      opts?.onSuccess?.();
      return { success: true };
    } catch (err: any) {
      toast.error(err?.message || (isEs ? 'No se pudo tomar la misión' : 'Could not take the mission'));
      return { success: false };
    } finally {
      setActivatingId(null);
    }
  };

  return { activate, activatingId };
}
