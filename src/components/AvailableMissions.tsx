import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActivateMission } from '@/hooks/useActivateMission';
import { Button } from '@/components/ui/button';
import { Rocket, Clock, Zap, DollarSign, Compass, Sparkles } from 'lucide-react';
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
  // Only present when ranked by the AI matching engine
  reason?: string;
  reason_es?: string;
  relevance?: number;
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
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rankedByAI, setRankedByAI] = useState(false);
  const { activate, activatingId } = useActivateMission();

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Ask the matching Edge Function first. Returns up to 6 missions
      //    already ranked by skill fit + readiness with AI reasoning.
      let aiMissions: Mission[] = [];
      let aiSucceeded = false;
      try {
        const { data, error } = await supabase.functions.invoke('recommend-missions');
        if (!error && data?.recommendations?.length > 0) {
          const projectIds = [
            ...new Set(data.recommendations.map((r: any) => r.mission.project_id).filter(Boolean)),
          ] as string[];
          const { data: projectRows } = await supabase
            .from('projects')
            .select('id, title')
            .in('id', projectIds);
          const projectMap = new Map<string, string>();
          (projectRows || []).forEach((p) => projectMap.set(p.id, p.title));

          aiMissions = data.recommendations.map((r: any) => ({
            id: r.mission.id,
            title: r.mission.title,
            title_es: r.mission.title_es,
            description: r.mission.description,
            description_es: r.mission.description_es,
            skill: r.mission.skill,
            hours: Number(r.mission.hours),
            reward: Number(r.mission.reward),
            hourly_rate: Number(r.mission.hourly_rate),
            status: 'approved',
            project_id: r.mission.project_id,
            projectTitle: projectMap.get(r.mission.project_id) || 'Proyecto',
            reason: r.reason,
            reason_es: r.reason_es,
            relevance: r.relevance_score,
          }));
          aiSucceeded = true;
        }
      } catch {
        // Edge Function unavailable (rate limit, credits exhausted, auth issue).
        // Fall through to the local ranking below.
      }

      // 2) Always fetch the broader list so the "Ver más en Marketplace"
      //    overflow link stays accurate and we have a fallback list if AI
      //    returned nothing.
      const { data: missionRows } = await supabase
        .from('missions')
        .select('id, title, title_es, description, description_es, skill, hours, reward, hourly_rate, status, project_id, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(30);

      let takenIds: string[] = [];
      if (explorerProfileId) {
        const { data: assignRows } = await (supabase
          .from('mission_assignments' as any)
          .select('mission_id')
          .eq('explorer_id', explorerProfileId) as any);
        takenIds = (assignRows || []).map((a: any) => a.mission_id);
      }

      const available = (missionRows || []).filter((m) => !takenIds.includes(m.id));
      setTotalAvailable(available.length);

      if (aiSucceeded && aiMissions.length > 0) {
        setMissions(aiMissions);
        setRankedByAI(true);
        return;
      }

      // Fallback: local skill-string ranking
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
      setRankedByAI(false);
    } catch {
      setMissions([]);
      setTotalAvailable(0);
      setRankedByAI(false);
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
          {rankedByAI && (
            <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              {isEs ? 'IA' : 'AI'}
            </span>
          )}
        </div>
        <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full">
          {missions.length} {isEs ? 'listas' : 'ready'}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {totalAvailable > missions.length && (
          <Link to="/marketplace" className="block p-4 text-center text-xs font-heading font-semibold text-primary hover:bg-primary/5 transition-colors">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3 w-3" />
              {isEs
                ? `Ver ${totalAvailable - missions.length} misiones más en el Marketplace`
                : `See ${totalAvailable - missions.length} more missions in the Marketplace`}
            </span>
          </Link>
        )}
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
              <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
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
              {rankedByAI && (isEs ? m.reason_es : m.reason) && (
                <p className="text-[11px] text-primary/80 font-body italic leading-snug">
                  <Sparkles className="inline h-2.5 w-2.5 mr-1" />
                  {isEs ? m.reason_es : m.reason}
                </p>
              )}
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
