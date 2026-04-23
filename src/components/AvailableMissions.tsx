import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivateMission } from '@/hooks/useActivateMission';
import { Button } from '@/components/ui/button';
import { Rocket, Clock, Zap, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface Mission {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  skill: string;
  hours: number;
  reward: number;
  hourly_rate: number;
  status: string;
  project_id: string;
  projectTitle: string;
}

interface Props {
  explorerProfileId: string | null;
  explorerSkills: string[];
  onActivated: () => void;
}

const AvailableMissions = ({ explorerProfileId, explorerSkills, onActivated }: Props) => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const { activate, activatingId } = useActivateMission();

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: missionRows, error } = await supabase
        .from('missions')
        .select('id, title, title_es, description, description_es, skill, hours, reward, hourly_rate, status, project_id, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      let takenIds: string[] = [];
      if (explorerProfileId) {
        const { data: assignRows } = await (supabase
          .from('mission_assignments' as any)
          .select('mission_id')
          .eq('explorer_id', explorerProfileId) as any);
        takenIds = (assignRows || []).map((a: any) => a.mission_id);
      }

      const available = (missionRows || []).filter((m) => !takenIds.includes(m.id));

      const projectIds = [...new Set(available.map((m) => m.project_id))];
      const projectMap = new Map<string, string>();
      if (projectIds.length > 0) {
        const { data: projectRows } = await supabase
          .from('projects')
          .select('id, title')
          .in('id', projectIds);
        (projectRows || []).forEach((p) => projectMap.set(p.id, p.title));
      }

      const enriched: Mission[] = available.map((m: any) => ({
        id: m.id,
        title: m.title,
        title_es: m.title_es,
        description: m.description,
        description_es: m.description_es,
        skill: m.skill,
        hours: Number(m.hours),
        reward: Number(m.reward),
        hourly_rate: Number(m.hourly_rate),
        status: m.status,
        project_id: m.project_id,
        projectTitle: projectMap.get(m.project_id) || 'Proyecto',
      }));

      const skillsLower = (explorerSkills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
      enriched.sort((a, b) => {
        const aMatch = skillsLower.some((s) =>
          a.skill?.toLowerCase().includes(s) || s.includes(a.skill?.toLowerCase() || '')
        );
        const bMatch = skillsLower.some((s) =>
          b.skill?.toLowerCase().includes(s) || s.includes(b.skill?.toLowerCase() || '')
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });

      setMissions(enriched.slice(0, 6));
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [explorerProfileId, explorerSkills]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleActivate = async (missionId: string) => {
    await activate(missionId, {
      onSuccess: () => {
        loadMissions();
        onActivated();
      },
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-4 w-4 text-primary" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card p-6 text-center">
        <Rocket className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-heading font-bold text-sm mb-2">
          {isEs ? 'No hay misiones disponibles ahora' : 'No missions available right now'}
        </h3>
        <p className="text-xs text-muted-foreground font-body">
          {isEs
            ? 'Vuelve pronto — las empresas publican nuevas misiones cada día.'
            : 'Check back soon — new missions drop daily.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="p-5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="font-heading font-bold text-sm">
            {isEs ? 'Misiones disponibles para ti' : 'Available missions for you'}
          </h2>
        </div>
        <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full">
          {missions.length} {isEs ? 'listas' : 'ready'}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {missions.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-sm mb-1 truncate">
                {isEs && m.title_es ? m.title_es : m.title}
              </h3>
              <p className="text-xs text-muted-foreground font-body truncate mb-2">{m.projectTitle}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-primary font-heading font-bold">
                  <DollarSign className="h-3 w-3" />${Number(m.reward).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {m.hours}h
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  {m.skill}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 font-heading tracking-wide bg-primary hover:bg-primary/90 text-white shrink-0"
              onClick={() => handleActivate(m.id)}
              disabled={!!activatingId}
            >
              {activatingId === m.id
                ? (isEs ? 'Activando...' : 'Activating...')
                : (isEs ? 'Activarme' : 'Take mission')}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AvailableMissions;
