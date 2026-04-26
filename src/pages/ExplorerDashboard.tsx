import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Compass, Zap, CheckCircle, DollarSign, Star, Trophy, ExternalLink,
  Send, ChevronRight, Clock, FileText, LinkIcon, GraduationCap,
  ShoppingBag, Wallet, Award, TrendingUp, Rocket, Target, Video
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BalanceModule from '@/components/BalanceModule';
import { toast } from 'sonner';
import ExplorerOnboarding from '@/components/ExplorerOnboarding';
import { motion } from 'framer-motion';
import SkillPassport from '@/components/SkillPassport';
import DailyMissions from '@/components/DailyMissions';
import StreakTracker from '@/components/StreakTracker';
import SocialProof from '@/components/SocialProof';
import SmartRecommendations from '@/components/SmartRecommendations';
import AvailableMissions from '@/components/AvailableMissions';
import { useEngagementData, getXPLevel, useTrackActivity } from '@/hooks/useEngagement';
import { useRefreshBadges } from '@/hooks/useSkillPassport';
import { useToolsForSkill, useTrackToolUsage, usePromptsForSkill, useTrackPromptUse } from '@/hooks/useAcademy';
import { Wrench, Sparkles, Copy } from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  mission_id: string;
  status: string;
  delivery_url: string | null;
  delivered_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

interface Mission {
  id: string;
  created_at: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  reward: number;
  skill: string;
  project_id: string;
  hours: number;
  hourly_rate: number;
}

interface Project {
  id: string;
  created_at: string;
  title: string;
  resource_link: string | null;
}

interface ApplicationWithMission {
  id: string;
  status: string;
  created_at: string;
  mission_id: string;
  missionTitle: string;
  missionTitleEs: string | null;
  missionDescription: string | null;
  missionDescriptionEs: string | null;
  missionReward: number;
  missionSkill: string;
  missionHours: number;
  missionHourlyRate: number;
  projectTitle: string;
  projectResourceLink: string | null;
  projectVideoLink: string | null;
  projectSpecsPdfUrl: string | null;
  delivery_url: string | null;
  delivered_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const ExplorerDashboard = () => {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const { user, explorerProfile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithMission | null>(null);
  const [missionTab, setMissionTab] = useState('active');
  const [mainTab, setMainTab] = useState('dashboard');

  const { data: engagement } = useEngagementData();
  const trackActivity = useTrackActivity();
  const refreshBadges = useRefreshBadges();
  const { data: recommendedTools = [] } = useToolsForSkill(selectedApp?.missionSkill || null);
  const { data: recommendedPrompts = [] } = usePromptsForSkill(selectedApp?.missionSkill || null);
  const trackToolUsage = useTrackToolUsage();
  const trackPromptUse = useTrackPromptUse();

  const handleCopyMissionPrompt = async (prompt: typeof recommendedPrompts[0]) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success(isEs ? 'Prompt copiado. Pegá con Ctrl+V (Cmd+V).' : 'Prompt copied. Paste with Ctrl+V (Cmd+V).');
    } catch {
      toast.error(isEs ? 'No se pudo copiar al portapapeles' : 'Could not copy to clipboard');
    }
    if (selectedApp) {
      trackPromptUse.mutate({ promptId: prompt.id, missionAssignmentId: selectedApp.id });
    }
    if (prompt.toolUrl) {
      window.open(prompt.toolUrl, '_blank', 'noopener');
    }
  };

  // Track daily login + refresh badges (idempotently awards any badges the
  // explorer qualifies for based on their current stats).
  useEffect(() => {
    if (user && explorerProfile?.id) {
      trackActivity.mutate('course_view');
      refreshBadges.mutate(explorerProfile.id);
    }
  }, [user, explorerProfile?.id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setOnboardingDone(data?.onboarding_completed ?? false);
      });
  }, [user]);

  const loadData = async () => {
    if (!user || !explorerProfile) return;
    setLoading(true);
    const { data: assignRows } = await (supabase
      .from('mission_assignments' as any)
      .select('id, status, created_at, mission_id, delivery_url, delivered_at, reviewed_at, review_note')
      .eq('explorer_id', explorerProfile.id)
      .order('created_at', { ascending: false }) as any);

    const assigns = assignRows || [];

    if (assigns.length > 0) {
      const missionIds = [...new Set(assigns.map((a: any) => a.mission_id))];
      const { data: missionRows } = await supabase
        .from('missions')
        .select('id, title, title_es, description, description_es, reward, skill, project_id, hours, hourly_rate')
        .in('id', missionIds as any);

      const mRows = missionRows || [];
      const projectIds = [...new Set(mRows.map((m) => m.project_id))];
      const projectMap = new Map<string, { title: string; resource_link: string | null; video_link: string | null; specs_pdf_url: string | null }>();

      if (projectIds.length > 0) {
        const { data: projectRows } = await supabase
          .from('projects')
          .select('id, title, resource_link, video_link, specs_pdf_url')
          .in('id', projectIds);
        (projectRows || []).forEach((p: any) => projectMap.set(p.id, { title: p.title, resource_link: p.resource_link, video_link: p.video_link, specs_pdf_url: p.specs_pdf_url }));
      }

      const missionMap = new Map(mRows.map((m) => [m.id, m]));

      const mapped: ApplicationWithMission[] = assigns.map((a: any) => {
        const mission = missionMap.get(a.mission_id);
        const project = mission ? projectMap.get(mission.project_id) : undefined;
        return {
          id: a.id,
          status: a.status,
          created_at: a.created_at,
          mission_id: a.mission_id,
          missionTitle: mission?.title || 'Mission',
          missionTitleEs: mission?.title_es || null,
          missionDescription: mission?.description || null,
          missionDescriptionEs: mission?.description_es || null,
          missionReward: Number(mission?.reward || 0),
          missionSkill: mission?.skill || '',
          missionHours: Number(mission?.hours || 0),
          missionHourlyRate: Number(mission?.hourly_rate || 0),
          projectTitle: project?.title || 'Project',
          projectResourceLink: project?.resource_link || null,
          projectVideoLink: project?.video_link || null,
          projectSpecsPdfUrl: project?.specs_pdf_url || null,
          delivery_url: a.delivery_url,
          delivered_at: a.delivered_at,
          reviewed_at: a.reviewed_at,
          review_note: a.review_note,
        };
      });
      setApplications(mapped);
    } else {
      setApplications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmitDelivery = async (appId: string) => {
    const url = deliveryUrls[appId]?.trim();
    if (!url) {
      toast.error(isEs ? 'Ingresa el link de tu entrega' : 'Enter your delivery link');
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error(isEs ? 'Ingresa una URL válida (ej: https://...)' : 'Enter a valid URL (e.g. https://...)');
      return;
    }

    setSubmittingId(appId);
    try {
      const { error } = await (supabase
        .from('mission_assignments' as any)
        .update({
          delivery_url: url,
          delivered_at: new Date().toISOString(),
          status: 'submitted',
        })
        .eq('id', appId) as any);

      if (error) throw error;
      toast.success(isEs ? 'Entrega enviada correctamente' : 'Delivery submitted successfully');
      setDeliveryUrls((prev) => ({ ...prev, [appId]: '' }));
      trackActivity.mutate('mission_delivered');
      if (explorerProfile?.id) refreshBadges.mutate(explorerProfile.id);
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isEs ? 'Error al enviar' : 'Submission error'));
    } finally {
      setSubmittingId(null);
    }
  };

  const activeMissions = applications.filter((a) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(a.status));
  const completedMissions = applications.filter((a) => ['approved', 'completed', 'funds_released'].includes(a.status));
  const completedCount = completedMissions.length;
  const totalEarnings = completedMissions.reduce((sum, a) => sum + a.missionReward, 0);

  const xpLevel = engagement ? getXPLevel(engagement.totalXP) : null;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = isEs
      ? { assigned: 'ASIGNADA', in_progress: 'EN PROGRESO', submitted: 'EN REVISIÓN', approved: 'APROBADA', rejected: 'RECHAZADA', paid: 'PAGADA' }
      : { assigned: 'ASSIGNED', in_progress: 'IN PROGRESS', submitted: 'IN REVIEW', approved: 'APPROVED', rejected: 'REJECTED', paid: 'PAID' };
    return map[status] || status.toUpperCase();
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      assigned: 'bg-primary/10 text-primary',
      in_progress: 'bg-primary/10 text-primary',
      submitted: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      approved: 'bg-green-500/10 text-green-600 dark:text-green-400',
      paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
      rejected: 'bg-destructive/10 text-destructive',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  if (onboardingDone === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!onboardingDone) {
    return <ExplorerOnboarding onComplete={() => setOnboardingDone(true)} />;
  }

  const displayName = explorerProfile?.name || user?.email?.split('@')[0] || 'Explorer';

  const filteredMissions = missionTab === 'active' ? activeMissions : completedMissions;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-10 max-w-6xl space-y-8">

        {/* ─── Welcome Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <p className="text-sm text-muted-foreground font-body mb-1">
              {isEs ? 'Bienvenido de vuelta' : 'Welcome back'}
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {xpLevel && (
                <>
                  <span className="text-lg">{xpLevel.icon}</span>
                  <span className="text-sm font-heading font-semibold text-primary">
                    {isEs ? xpLevel.nameEs : xpLevel.name}
                  </span>
                  <span className="text-xs text-muted-foreground">• Lv.{xpLevel.level}</span>
                  {engagement && engagement.streak > 0 && (
                    <span className="text-xs text-primary font-heading font-bold ml-1">
                      🔥 {engagement.streak}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/academy">
              <Button variant="outline" size="sm" className="gap-2 font-heading">
                <GraduationCap className="h-4 w-4" />
                {isEs ? 'Academia' : 'Academy'}
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="hero" size="sm" className="gap-2">
                <Compass className="h-4 w-4" />
                {isEs ? 'Explorar Misiones' : 'Browse Missions'}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ─── Main Tabs ─── */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto border-b border-border/50 rounded-none gap-0 mb-6">
            <TabsTrigger
              value="dashboard"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm"
            >
              {isEs ? 'Panel' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger
              value="passport"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm gap-1.5"
            >
              🛂 Skill Passport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="passport">
            <SkillPassport />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-8">

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ─── Block 1: Available missions for you (Uber-style) ─── */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
                  <AvailableMissions
                    explorerProfileId={explorerProfile?.id || null}
                    explorerSkills={Array.isArray(explorerProfile?.skills) ? explorerProfile.skills : []}
                    onActivated={loadData}
                  />
                </motion.div>

                {/* ─── Engagement Row: Streak + Daily Missions ─── */}
                <div className="grid md:grid-cols-5 gap-4">
                  <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="md:col-span-2">
                    <StreakTracker />
                  </motion.div>
                  <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={1} className="md:col-span-3">
                    <DailyMissions />
                  </motion.div>
                </div>

                {/* ─── Stats Grid ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { icon: Target, label: isEs ? 'Misiones Activas' : 'Active Missions', value: String(activeMissions.length), accent: true },
                    { icon: CheckCircle, label: isEs ? 'Completadas' : 'Completed', value: String(completedCount), accent: false },
                    { icon: DollarSign, label: isEs ? 'Ganancias' : 'Earnings', value: `$${totalEarnings.toLocaleString()}`, accent: false },
                    { icon: Zap, label: 'XP', value: engagement ? engagement.totalXP.toLocaleString() : '0', accent: false },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      custom={i + 2}
                      initial="hidden"
                      animate="visible"
                      variants={fadeIn}
                      className={`rounded-xl border p-4 md:p-5 transition-all hover:shadow-md ${stat.accent ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`h-4 w-4 ${stat.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground font-body truncate">{stat.label}</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-heading font-bold">{stat.value}</div>
                    </motion.div>
                  ))}
                </div>

                {/* ─── Recommendations + Social Proof ─── */}
                <div className="grid md:grid-cols-5 gap-4">
                  <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={6} className="md:col-span-3">
                    <SmartRecommendations />
                  </motion.div>
                  <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={7} className="md:col-span-2">
                    <SocialProof />
                  </motion.div>
                </div>

                {/* ─── Balance Section ─── */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={8}>
                  <div className="rounded-xl border border-border/50 bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="h-4 w-4 text-primary" />
                      <h2 className="font-heading font-bold text-sm">{isEs ? 'Balance y Retiros' : 'Balance & Withdrawals'}</h2>
                    </div>
                    <BalanceModule />
                  </div>
                </motion.div>

                {/* ─── Missions Section with Tabs ─── */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={9}>
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="p-5 pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-primary" />
                          <h2 className="font-heading font-bold text-sm">{isEs ? 'Mis Misiones' : 'My Missions'}</h2>
                        </div>
                        <Badge variant="secondary" className="font-heading text-xs">
                          {applications.length} {isEs ? 'total' : 'total'}
                        </Badge>
                      </div>
                      <Tabs value={missionTab} onValueChange={setMissionTab}>
                        <TabsList className="w-full justify-start bg-transparent p-0 h-auto border-b border-border/50 rounded-none gap-0">
                          <TabsTrigger
                            value="active"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm"
                          >
                            {isEs ? 'Activas' : 'Active'} ({activeMissions.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="completed"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 font-heading text-sm"
                          >
                            {isEs ? 'Completadas' : 'Completed'} ({completedMissions.length})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value={missionTab} className="mt-0">
                          <div className="divide-y divide-border/50">
                            {filteredMissions.length === 0 && (
                              <div className="p-10 text-center">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                                  {missionTab === 'active' ? <Target className="h-5 w-5 text-muted-foreground" /> : <CheckCircle className="h-5 w-5 text-muted-foreground" />}
                                </div>
                                <p className="text-sm text-muted-foreground font-body">
                                  {missionTab === 'active'
                                    ? (isEs ? 'No tienes misiones activas.' : 'No active missions.')
                                    : (isEs ? 'Aún no has completado misiones.' : 'No completed missions yet.')}
                                </p>
                                {missionTab === 'active' && (
                                  <Link to="/marketplace">
                                    <Button variant="outline" size="sm" className="mt-3 gap-2 font-heading text-xs">
                                      <Compass className="h-3.5 w-3.5" />
                                      {isEs ? 'Explorar Marketplace' : 'Browse Marketplace'}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )}
                            {filteredMissions.map((app) => (
                              <div
                                key={app.id}
                                className="p-4 md:px-5 flex items-center gap-4 cursor-pointer hover:bg-muted/40 transition-colors group"
                                onClick={() => setSelectedApp(app)}
                              >
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Award className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-heading font-semibold text-sm truncate">
                                    {isEs && app.missionTitleEs ? app.missionTitleEs : app.missionTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-body truncate">{app.projectTitle}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`text-[10px] font-heading font-bold px-2 py-1 rounded-full ${statusColor(app.status)}`}>
                                    {statusLabel(app.status)}
                                  </span>
                                  <span className="text-sm font-heading font-bold text-primary hidden sm:block">${app.missionReward.toLocaleString()}</span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Mission Detail Dialog ─── */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">
                  {isEs && selectedApp.missionTitleEs ? selectedApp.missionTitleEs : selectedApp.missionTitle}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Status & Reward */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs font-heading font-semibold px-3 py-1.5 rounded-full ${statusColor(selectedApp.status)}`}>
                    {statusLabel(selectedApp.status)}
                  </span>
                  <span className="text-sm font-heading font-semibold text-primary">${selectedApp.missionReward.toLocaleString()}</span>
                  <Badge variant="outline" className="text-xs">{selectedApp.missionSkill}</Badge>
                </div>

                {/* Mission Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-body">{isEs ? 'Horas estimadas' : 'Est. hours'}</p>
                      <p className="text-sm font-heading font-semibold">{selectedApp.missionHours}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-body">{isEs ? 'Tarifa/hora' : 'Hourly rate'}</p>
                      <p className="text-sm font-heading font-semibold">${selectedApp.missionHourlyRate}/h</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(selectedApp.missionDescription || selectedApp.missionDescriptionEs) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-heading font-semibold text-sm">{isEs ? 'Descripción' : 'Description'}</h3>
                    </div>
                    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">
                        {isEs ? (selectedApp.missionDescriptionEs || selectedApp.missionDescription) : (selectedApp.missionDescription || selectedApp.missionDescriptionEs)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Project & Resources */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-heading font-semibold text-sm">{isEs ? 'Proyecto y recursos' : 'Project & resources'}</h3>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-2">
                    <p className="text-sm font-body">
                      <span className="text-muted-foreground">{isEs ? 'Proyecto:' : 'Project:'}</span>{' '}
                      <span className="font-semibold">{selectedApp.projectTitle}</span>
                    </p>
                    {selectedApp.projectVideoLink && (
                      <a href={selectedApp.projectVideoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:underline font-body font-semibold"
                        onClick={(e) => e.stopPropagation()}>
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <Video className="h-3.5 w-3.5" />
                        {isEs ? 'Ver en vivo' : 'Watch live'}
                      </a>
                    )}
                    {selectedApp.projectResourceLink && (
                      <a href={selectedApp.projectResourceLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-body"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isEs ? 'Recursos del proyecto' : 'Project resources'}
                      </a>
                    )}
                    {selectedApp.projectSpecsPdfUrl && (
                      <a href={selectedApp.projectSpecsPdfUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-body"
                        onClick={(e) => e.stopPropagation()}>
                        <FileText className="h-3.5 w-3.5" />
                        {isEs ? 'Specs del proyecto (PDF)' : 'Project specs (PDF)'}
                      </a>
                    )}
                    {!selectedApp.projectResourceLink && !selectedApp.projectVideoLink && !selectedApp.projectSpecsPdfUrl && (
                      <p className="text-xs text-muted-foreground font-body italic">
                        {isEs ? 'No hay recursos adicionales.' : 'No additional resources.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Battle-tested prompts for this mission's skill */}
                {recommendedPrompts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-heading font-semibold text-sm">
                        {isEs ? 'Prompts útiles' : 'Useful prompts'}
                      </h3>
                      <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedApp.missionSkill}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recommendedPrompts.map((p) => {
                        const rate = p.stats?.approval_rate;
                        const battleTested = rate !== null && rate !== undefined && (p.stats?.mission_uses || 0) >= 3;
                        return (
                          <div key={p.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <p className="font-heading font-semibold text-xs">{p.title}</p>
                                  {p.is_official && (
                                    <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30">GOPHORA Team</Badge>
                                  )}
                                  {battleTested && (
                                    <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                      ⚔️ {rate}% approval
                                    </Badge>
                                  )}
                                </div>
                                {p.toolName && (
                                  <span className="text-[10px] font-heading font-semibold text-muted-foreground">
                                    {isEs ? 'Para ' : 'For '}{p.toolName}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="default"
                                className="text-[11px] gap-1 h-7 bg-primary hover:bg-primary/90 text-white shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyMissionPrompt(p);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                                {isEs ? 'Copiar' : 'Copy'}
                              </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-body whitespace-pre-wrap line-clamp-3">{p.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommended tools for this mission's skill */}
                {recommendedTools.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <h3 className="font-heading font-semibold text-sm">
                        {isEs ? 'Herramientas recomendadas' : 'Recommended tools'}
                      </h3>
                      <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedApp.missionSkill}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {recommendedTools.map((t) => (
                        <a
                          key={t.id}
                          href={t.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackToolUsage.mutate({ toolId: t.id, missionId: selectedApp.mission_id });
                          }}
                          className="rounded-lg border border-border/50 bg-muted/20 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <p className="font-heading font-semibold text-sm truncate mb-1">{isEs && t.name_es ? t.name_es : t.name}</p>
                          <p className="text-[11px] text-muted-foreground font-body line-clamp-2 mb-2">
                            {isEs ? (t.description_es || t.description) : (t.description || t.description_es)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-heading font-semibold text-primary">
                            <ExternalLink className="h-2.5 w-2.5" />
                            {isEs ? 'Abrir' : 'Open'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review note */}
                {selectedApp.review_note && (
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-body mb-1">{isEs ? 'Nota de revisión:' : 'Review note:'}</p>
                    <p className="text-sm font-body italic">{selectedApp.review_note}</p>
                  </div>
                )}

                {/* Delivery section */}
                {['assigned', 'in_progress', 'rejected'].includes(selectedApp.status) && (
                  <div className="space-y-2 border-t border-border/50 pt-4">
                    <h3 className="font-heading font-semibold text-sm">{isEs ? 'Entregar trabajo' : 'Submit delivery'}</h3>
                    {selectedApp.status === 'rejected' && selectedApp.review_note && (
                      <p className="text-sm text-destructive font-body italic">
                        {isEs ? 'Motivo del rechazo:' : 'Rejection reason:'} {selectedApp.review_note}
                      </p>
                    )}
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="https://link-to-your-work.com"
                        value={deliveryUrls[selectedApp.id] || ''}
                        onChange={(e) => setDeliveryUrls((prev) => ({ ...prev, [selectedApp.id]: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        className="gap-1 font-heading text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmitDelivery(selectedApp.id);
                        }}
                        disabled={submittingId === selectedApp.id}
                      >
                        <Send className="h-3 w-3" />
                        {submittingId === selectedApp.id
                          ? (isEs ? 'Enviando...' : 'Sending...')
                          : selectedApp.status === 'rejected'
                            ? (isEs ? 'Reenviar' : 'Resubmit')
                            : (isEs ? 'Entregar' : 'Submit')}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedApp.status === 'submitted' && (
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-sm font-heading font-semibold text-yellow-600 dark:text-yellow-400">
                        {isEs ? 'En revisión' : 'In review'}
                      </span>
                    </div>
                    {selectedApp.delivery_url && (
                      <a href={selectedApp.delivery_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline font-body truncate">
                        <ExternalLink className="h-3 w-3" /> {selectedApp.delivery_url}
                      </a>
                    )}
                  </div>
                )}

                {(selectedApp.status === 'completed' || selectedApp.status === 'funds_released') && selectedApp.delivery_url && (
                  <div className="flex items-center gap-2 text-sm border-t border-border/50 pt-4">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <a href={selectedApp.delivery_url} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline font-body truncate">
                      {selectedApp.delivery_url}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExplorerDashboard;
