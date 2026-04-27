import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useActivateMission } from '@/hooks/useActivateMission';
import { Search, Clock, DollarSign, User, Zap, X, ArrowRight, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const skills = ['All', 'Design', 'Web Development', 'Marketing', 'Data', 'Research', 'Operations'];

interface MarketplaceMission {
  id: string;
  title: string;
  title_es: string | null;
  skill: string;
  hours: number;
  reward: number;
  hourly_rate: number;
  description: string | null;
  description_es: string | null;
  requirements: string[] | null;
  project_id: string;
  projectTitle: string;
  resourceLink: string | null;
  videoLink: string | null;
  specsPdfUrl: string | null;
}

const Marketplace = () => {
  const { t, language } = useLanguage();
  const { user, companyProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillParam = searchParams.get('skill');
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(skillParam && skills.includes(skillParam) ? skillParam : 'All');
  const [missions, setMissions] = useState<MarketplaceMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatedMissionIds, setActivatedMissionIds] = useState<string[]>([]);
  const [selectedMission, setSelectedMission] = useState<MarketplaceMission | null>(null);
  const { activate, activatingId: activatingMissionId } = useActivateMission();

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      let userProjectIds: string[] = [];
      if (user) {
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);
        userProjectIds = (userProjects || []).map(p => p.id);
      }

      let query = supabase
        .from('missions')
        .select('id, title, title_es, skill, hours, reward, hourly_rate, description, description_es, requirements, project_id, status, created_at');

      if (userProjectIds.length > 0) {
        // PostgREST: UUIDs inside `in.(...)` must NOT be quoted.
        query = query.or(`status.eq.approved,project_id.in.(${userProjectIds.join(',')})`);
      } else {
        query = query.eq('status', 'approved');
      }

      const { data: missionRows, error: missionsError } = await query
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      const allProjectIds = [...new Set((missionRows || []).map((m) => m.project_id))];
      type ProjectInfo = { title: string; resource_link: string | null; video_link: string | null; specs_pdf_url: string | null };
      let projectMap = new Map<string, ProjectInfo>();

      if (allProjectIds.length > 0) {
        const { data: projectRows, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, resource_link, video_link, specs_pdf_url')
          .in('id', allProjectIds);
        if (projectsError) throw projectsError;
        projectMap = new Map((projectRows || []).map((p: any) => [p.id, {
          title: p.title,
          resource_link: p.resource_link || null,
          video_link: p.video_link || null,
          specs_pdf_url: p.specs_pdf_url || null,
        }]));
      }

      const mappedMissions = (missionRows || []).map((m) => ({
        id: m.id,
        title: m.title,
        title_es: (m as any).title_es || null,
        skill: m.skill,
        hours: Number(m.hours),
        reward: Number(m.reward),
        hourly_rate: Number(m.hourly_rate),
        description: m.description,
        description_es: (m as any).description_es || null,
        requirements: Array.isArray((m as any).requirements) ? (m as any).requirements : null,
        project_id: m.project_id,
        projectTitle: projectMap.get(m.project_id)?.title || 'Proyecto',
        resourceLink: projectMap.get(m.project_id)?.resource_link || null,
        videoLink: projectMap.get(m.project_id)?.video_link || null,
        specsPdfUrl: projectMap.get(m.project_id)?.specs_pdf_url || null,
      }));

      setMissions(mappedMissions);

      if (user) {
        // Fetch explorer profile first to get its ID
        const { data: expProfile } = await (supabase.from('explorer_profiles' as any).select('id').eq('user_id', user.id).single() as any);

        if (expProfile) {
          const { data: assignRows, error: assignError } = await (supabase
            .from('mission_assignments' as any)
            .select('mission_id')
            .eq('explorer_id', expProfile.id) as any);
          if (assignError) throw assignError;
          setActivatedMissionIds((assignRows || []).map((a: any) => a.mission_id));
        }
      } else {
        setActivatedMissionIds([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar el marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [user]);

  const filtered = useMemo(() => {
    return missions.filter((m) => {
      const title = language === 'es' ? (m.title_es || m.title) : m.title;
      const matchSearch = title.toLowerCase().includes(search.toLowerCase());
      const matchSkill = selectedSkill === 'All' || m.skill === selectedSkill;
      return matchSearch && matchSkill;
    });
  }, [missions, search, selectedSkill]);

  const handleActivateMission = async (missionId: string) => {
    if (activatedMissionIds.includes(missionId)) {
      toast.success(language === 'en' ? 'This mission is already yours' : 'Esta misión ya es tuya');
      return;
    }
    const { success } = await activate(missionId, {
      onSuccess: () => {
        setActivatedMissionIds((prev) => [...prev, missionId]);
      },
    });
    if (success) {
      setTimeout(() => navigate('/explorer'), 1500);
    }
  };

  const mt = (mission: MarketplaceMission, field: 'title' | 'description') => {
    if (language === 'es') {
      if (field === 'title') return mission.title_es || mission.title;
      return mission.description_es || mission.description;
    }
    return field === 'title' ? mission.title : mission.description;
  };

  const parseDeliverables = (mission: MarketplaceMission): string[] => {
    // Prefer the structured `requirements` array generated by the AI Mission
    // Architect over re-parsing the prose description. The reviewer flagged
    // that descriptions sometimes have no bullet structure at all, leaving
    // the "Entregables Esperados" panel showing the entire paragraph as one
    // step.
    if (mission.requirements && mission.requirements.length > 0) {
      return mission.requirements
        .map(r => String(r || '').trim())
        .filter(Boolean);
    }
    const desc = mt(mission, 'description');
    if (!desc) return [];
    const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
    const deliverables = lines.filter(l =>
      l.startsWith('-') || l.startsWith('•') || l.startsWith('*') || /^\d+[\.\)]/.test(l)
    ).map(l => l.replace(/^[-•*]\s*/, '').replace(/^\d+[\.\)]\s*/, ''));
    return deliverables.length > 0 ? deliverables : [desc];
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold">{t('marketplace.title')}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t('marketplace.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {skills.map((skill) => (
            <Button
              key={skill}
              variant={selectedSkill === skill ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSkill(skill)}
              className="font-heading text-xs whitespace-nowrap"
            >
              {skill}
            </Button>
          ))}
        </div>
      </div>

      {/* Mission Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filtered.map((mission) => {
          const activated = activatedMissionIds.includes(mission.id);
          const activating = activatingMissionId === mission.id;

          return (
            <div
              key={mission.id}
              className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => setSelectedMission(mission)}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {mission.skill}
                </span>
                <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-heading font-bold mb-3">{mt(mission, 'title')}</h3>
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mission.hours}h</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${mission.reward.toLocaleString()}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {mission.projectTitle}</span>
              </div>
              <Button
                className="w-full font-heading text-xs tracking-wide"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleActivateMission(mission.id); }}
                disabled={activated || activating || !!companyProfile}
              >
                {activating
                  ? (language === 'en' ? 'Activating...' : 'Activando...')
                  : activated
                    ? (language === 'en' ? 'Mission activated' : 'Misión activada')
                    : (!!companyProfile)
                      ? (language === 'en' ? 'Not for Organizations' : 'Solo Exploradores')
                      : t('marketplace.apply')}
              </Button>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground font-body">
          {language === 'en' ? 'No approved missions available right now.' : 'No hay misiones aprobadas disponibles por ahora.'}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border/50 bg-card p-10 text-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* ========== MISSION DETAIL MODAL ========== */}
      <AnimatePresence>
        {selectedMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedMission(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border/50 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 border-b border-border/50 bg-card">
                <div className="flex-1 pr-4">
                  <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {selectedMission.skill}
                  </span>
                  <h2 className="text-xl md:text-2xl font-heading font-bold mt-3">{mt(selectedMission, 'title')}</h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    {language === 'en' ? 'Project' : 'Proyecto'}: {selectedMission.projectTitle}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedMission(null)} className="shrink-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-6 pb-0">
                <div className="rounded-lg border border-border/50 bg-background p-4 text-center">
                  <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-heading font-bold">${selectedMission.reward.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-body">{language === 'en' ? 'Reward' : 'Recompensa'}</div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background p-4 text-center">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-heading font-bold">{selectedMission.hours}h</div>
                  <div className="text-xs text-muted-foreground font-body">{language === 'en' ? 'Est. Time' : 'Tiempo Est.'}</div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background p-4 text-center">
                  <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-heading font-bold">${selectedMission.hourly_rate}/h</div>
                  <div className="text-xs text-muted-foreground font-body">{language === 'en' ? 'Hourly Rate' : 'Tarifa/Hora'}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold">{language === 'en' ? 'Mission Description' : 'Descripción de la Misión'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed whitespace-pre-wrap">
                    {mt(selectedMission, 'description') || (language === 'en' ? 'No description available.' : 'Sin descripción disponible.')}
                  </p>
                </div>

                {/* Deliverables */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-bold">{language === 'en' ? 'Expected Deliverables' : 'Entregables Esperados'}</h3>
                  </div>
                  <div className="space-y-2">
                    {parseDeliverables(selectedMission).map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-heading font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-sm font-body text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Resources — Watch Live · Open Resources · Specs PDF */}
                {(selectedMission.videoLink || selectedMission.resourceLink || selectedMission.specsPdfUrl) && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-heading font-bold">
                        {language === 'en' ? 'Project Resources & Brief' : 'Recursos y Brief del Proyecto'}
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {selectedMission.videoLink && (
                        <a
                          href={selectedMission.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-heading font-bold uppercase tracking-wider text-red-500">
                              {language === 'en' ? 'Watch Live' : 'Ver en vivo'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">
                              {language === 'en' ? 'Project explanation' : 'Explicación del proyecto'}
                            </p>
                          </div>
                        </a>
                      )}
                      {selectedMission.resourceLink && (
                        <a
                          href={selectedMission.resourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-heading font-bold uppercase tracking-wider text-primary">
                              {language === 'en' ? 'Open Resources' : 'Abrir Recursos'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">
                              {language === 'en' ? 'Brand assets · brief' : 'Activos · brief'}
                            </p>
                          </div>
                        </a>
                      )}
                      {selectedMission.specsPdfUrl && (
                        <a
                          href={selectedMission.specsPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-heading font-bold uppercase tracking-wider text-blue-500">
                              {language === 'en' ? 'Specs PDF' : 'PDF Specs'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">
                              {language === 'en' ? 'Detailed requirements' : 'Requisitos detallados'}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body mt-2 leading-relaxed">
                      {language === 'en'
                        ? 'Use these to understand the brief before activating. The Watch Live link is the company\'s recorded explanation, Open Resources contains brand assets and palette, and Specs PDF lists detailed requirements.'
                        : 'Usá estos recursos para entender el brief antes de activarte. Ver en vivo es la explicación grabada de la empresa, Abrir Recursos contiene activos de marca y paleta, y PDF Specs lista los requisitos detallados.'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {(() => {
                    const activated = activatedMissionIds.includes(selectedMission.id);
                    const activating = activatingMissionId === selectedMission.id;
                    return (
                      <>
                        <Button
                          className="flex-1 font-heading tracking-wide gap-2"
                          onClick={() => handleActivateMission(selectedMission.id)}
                          disabled={activated || activating || !!companyProfile}
                        >
                          {activating
                            ? (language === 'en' ? 'Activating...' : 'Activando...')
                            : activated
                              ? (language === 'en' ? '✓ Mission activated' : '✓ Misión activada')
                              : (!!companyProfile)
                                ? (language === 'en' ? 'Not for Organizations' : 'Solo para Exploradores')
                                : (
                                  <>{t('marketplace.apply')} <ArrowRight className="h-4 w-4" /></>
                                )}
                        </Button>
                        {activated && (
                          <Link to="/explorer" className="flex-1">
                            <Button variant="outline" className="w-full font-heading tracking-wide gap-2">
                              <ExternalLink className="h-4 w-4" />
                              {language === 'en' ? 'Go to delivery' : 'Ir a entregar trabajo'}
                            </Button>
                          </Link>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
