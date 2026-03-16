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
  ShoppingBag, Wallet, Award, TrendingUp, Rocket, Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BalanceModule from '@/components/BalanceModule';
import { toast } from 'sonner';
import ExplorerOnboarding from '@/components/ExplorerOnboarding';
import { motion } from 'framer-motion';
import SkillPassport from '@/components/SkillPassport';

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
  delivery_url: string | null;
  delivered_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

const levelConfig = [
  { name: 'Rookie', nameEs: 'Novato', threshold: 0, icon: '🌱' },
  { name: 'Explorer', nameEs: 'Explorador', threshold: 3, icon: '🧭' },
  { name: 'Specialist', nameEs: 'Especialista', threshold: 10, icon: '⚡' },
  { name: 'Elite Operator', nameEs: 'Operador Élite', threshold: 25, icon: '🔥' },
  { name: 'Legend', nameEs: 'Leyenda', threshold: 50, icon: '👑' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const ExplorerDashboard = () => {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithMission | null>(null);
  const [profile, setProfile] = useState<{ username: string | null; full_name: string | null } | null>(null);
  const [missionTab, setMissionTab] = useState('active');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('onboarding_completed, username, full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setOnboardingDone(data?.onboarding_completed ?? false);
        setProfile({ username: data?.username ?? null, full_name: data?.full_name ?? null });
      });
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: appRows } = await supabase
      .from('mission_applications')
      .select('id, status, created_at, mission_id, delivery_url, delivered_at, reviewed_at, review_note')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const apps = appRows || [];

    if (apps.length > 0) {
      const missionIds = [...new Set(apps.map((a) => a.mission_id))];
      const { data: missionRows } = await supabase
        .from('missions')
        .select('id, title, title_es, description, description_es, reward, skill, project_id, hours, hourly_rate')
        .in('id', missionIds);

      const mRows = missionRows || [];
      const projectIds = [...new Set(mRows.map((m) => m.project_id))];
      const projectMap = new Map<string, { title: string; resource_link: string | null }>();

      if (projectIds.length > 0) {
        const { data: projectRows } = await supabase
          .from('projects')
          .select('id, title, resource_link')
          .in('id', projectIds);
        (projectRows || []).forEach((p) => projectMap.set(p.id, { title: p.title, resource_link: p.resource_link }));
      }

      const missionMap = new Map(mRows.map((m) => [m.id, m]));

      const mapped: ApplicationWithMission[] = apps.map((a) => {
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
      const { error } = await supabase
        .from('mission_applications')
        .update({
          delivery_url: url,
          delivered_at: new Date().toISOString(),
          status: 'delivered',
        })
        .eq('id', appId);

      if (error) throw error;
      toast.success(isEs ? 'Entrega enviada correctamente' : 'Delivery submitted successfully');
      setDeliveryUrls((prev) => ({ ...prev, [appId]: '' }));
      loadData();
    } catch (err: any) {
      toast.error(err.message || (isEs ? 'Error al enviar' : 'Submission error'));
    } finally {
      setSubmittingId(null);
    }
  };

  const completedCount = applications.filter((a) => a.status === 'completed' || a.status === 'funds_released').length;
  const activeMissions = applications.filter((a) => a.status === 'pending' || a.status === 'delivered' || a.status === 'rejected');
  const completedMissions = applications.filter((a) => a.status === 'completed' || a.status === 'funds_released');
  const totalEarnings = completedMissions.reduce((sum, a) => sum + a.missionReward, 0);

  const currentLevel = levelConfig.reduce((lvl, l) => (completedCount >= l.threshold ? l : lvl), levelConfig[0]);
  const nextLevel = levelConfig[levelConfig.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel
    ? ((completedCount - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;

  const badges = [
    { name: isEs ? 'Explorador' : 'Explorer', icon: Compass, earned: applications.length >= 1, desc: isEs ? 'Primera misión activada' : 'First mission activated' },
    { name: isEs ? 'Especialista' : 'Specialist', icon: Star, earned: completedCount >= 5, desc: isEs ? '5 misiones completadas' : '5 missions completed' },
    { name: isEs ? 'Operador Élite' : 'Elite Operator', icon: Trophy, earned: completedCount >= 25, desc: isEs ? '25 misiones completadas' : '25 missions completed' },
    { name: isEs ? 'Velocista' : 'Speed Runner', icon: Zap, earned: completedCount >= 10, desc: isEs ? '10 misiones completadas' : '10 missions completed' },
  ];

  const statusLabel = (status: string) => {
    const map: Record<string, string> = isEs
      ? { pending: 'ACTIVA', delivered: 'EN REVISIÓN', completed: 'COMPLETADA', rejected: 'RECHAZADA', funds_released: 'PAGADA' }
      : { pending: 'ACTIVE', delivered: 'IN REVIEW', completed: 'COMPLETED', rejected: 'REJECTED', funds_released: 'PAID' };
    return map[status] || status.toUpperCase();
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-primary/10 text-primary',
      delivered: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
      rejected: 'bg-destructive/10 text-destructive',
      funds_released: 'bg-green-500/10 text-green-600 dark:text-green-400',
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

  const displayName = profile?.username ? `@${profile.username}` : profile?.full_name || user?.email?.split('@')[0] || 'Explorer';

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
              <span className="text-lg">{currentLevel.icon}</span>
              <span className="text-sm font-heading font-semibold text-primary">
                {isEs ? currentLevel.nameEs : currentLevel.name}
              </span>
              <span className="text-xs text-muted-foreground">• Level {levelConfig.indexOf(currentLevel) + 1}</span>
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: Target, label: isEs ? 'Misiones Activas' : 'Active Missions', value: String(activeMissions.length), accent: true },
                { icon: CheckCircle, label: isEs ? 'Completadas' : 'Completed', value: String(completedCount), accent: false },
                { icon: DollarSign, label: isEs ? 'Ganancias' : 'Earnings', value: `$${totalEarnings.toLocaleString()}`, accent: false },
                { icon: TrendingUp, label: isEs ? 'Nivel' : 'Level', value: `L${levelConfig.indexOf(currentLevel) + 1}`, accent: false },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
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

            {/* ─── Level + Badges Row ─── */}
            <div className="grid md:grid-cols-5 gap-4">
              {/* Level Progress */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={4}
                className="md:col-span-3 rounded-xl border border-border/50 bg-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-sm">{isEs ? 'Progreso de Nivel' : 'Level Progress'}</h2>
                  <Badge variant="outline" className="font-heading text-xs">
                    {completedCount} / {nextLevel ? nextLevel.threshold : currentLevel.threshold} {isEs ? 'misiones' : 'missions'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
                    {currentLevel.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-lg">{isEs ? currentLevel.nameEs : currentLevel.name}</p>
                    <Progress value={Math.min(progressToNext, 100)} className="h-2 mt-2" />
                    {nextLevel && (
                      <p className="text-xs text-muted-foreground mt-1.5 font-body">
                        {nextLevel.threshold - completedCount} {isEs ? 'misiones más para' : 'more missions to'}{' '}
                        <span className="font-semibold text-foreground">{isEs ? nextLevel.nameEs : nextLevel.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                {/* Mini level roadmap */}
                <div className="flex items-center gap-1 mt-2">
                  {levelConfig.map((lvl, i) => {
                    const isActive = levelConfig.indexOf(currentLevel) >= i;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                        <span className={`text-[10px] font-body ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          L{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Badges */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={5}
                className="md:col-span-2 rounded-xl border border-border/50 bg-card p-5"
              >
                <h2 className="font-heading font-bold text-sm mb-4">{isEs ? 'Insignias' : 'Badges'}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                        badge.earned
                          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                          : 'border-border/30 opacity-35 grayscale'
                      }`}
                    >
                      <badge.icon className={`h-5 w-5 ${badge.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-heading font-semibold leading-tight">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ─── Balance Section ─── */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={6}>
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="h-4 w-4 text-primary" />
                  <h2 className="font-heading font-bold text-sm">{isEs ? 'Balance y Retiros' : 'Balance & Withdrawals'}</h2>
                </div>
                <BalanceModule />
              </div>
            </motion.div>

            {/* ─── Missions Section with Tabs ─── */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={7}>
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
                    {selectedApp.projectResourceLink && (
                      <a href={selectedApp.projectResourceLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-body"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isEs ? 'Recursos del proyecto' : 'Project resources'}
                      </a>
                    )}
                    {!selectedApp.projectResourceLink && (
                      <p className="text-xs text-muted-foreground font-body italic">
                        {isEs ? 'No hay recursos adicionales.' : 'No additional resources.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Review note */}
                {selectedApp.review_note && (
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-body mb-1">{isEs ? 'Nota de revisión:' : 'Review note:'}</p>
                    <p className="text-sm font-body italic">{selectedApp.review_note}</p>
                  </div>
                )}

                {/* Delivery section */}
                {(selectedApp.status === 'pending' || selectedApp.status === 'rejected') && (
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

                {selectedApp.status === 'delivered' && (
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
