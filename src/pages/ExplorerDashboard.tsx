import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Compass, Zap, CheckCircle, DollarSign, Star, Trophy, ExternalLink, Send } from 'lucide-react';
import BalanceModule from '@/components/BalanceModule';
import { toast } from 'sonner';
import ExplorerOnboarding from '@/components/ExplorerOnboarding';

const StatCard = ({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-xl border p-6 transition-all hover:border-primary/30 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card'}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${accent ? 'bg-primary/20' : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <span className="text-sm text-muted-foreground font-body">{label}</span>
    </div>
    <div className="text-3xl font-heading font-bold">{value}</div>
  </div>
);

interface ApplicationWithMission {
  id: string;
  status: string;
  created_at: string;
  mission_id: string;
  missionTitle: string;
  missionReward: number;
  missionSkill: string;
  projectTitle: string;
  delivery_url: string | null;
  delivered_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

const levelConfig = [
  { name: 'Rookie', threshold: 0 },
  { name: 'Explorer', threshold: 3 },
  { name: 'Specialist', threshold: 10 },
  { name: 'Elite Operator', threshold: 25 },
  { name: 'Legend', threshold: 50 },
];

const ExplorerDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

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
        .select('id, title, reward, skill, project_id')
        .in('id', missionIds);

      const mRows = missionRows || [];
      const projectIds = [...new Set(mRows.map((m) => m.project_id))];
      const projectMap = new Map<string, string>();

      if (projectIds.length > 0) {
        const { data: projectRows } = await supabase
          .from('projects')
          .select('id, title')
          .in('id', projectIds);
        (projectRows || []).forEach((p) => projectMap.set(p.id, p.title));
      }

      const missionMap = new Map(mRows.map((m) => [m.id, m]));

      const mapped: ApplicationWithMission[] = apps.map((a) => {
        const mission = missionMap.get(a.mission_id);
        return {
          id: a.id,
          status: a.status,
          created_at: a.created_at,
          mission_id: a.mission_id,
          missionTitle: mission?.title || 'Mission',
          missionReward: Number(mission?.reward || 0),
          missionSkill: mission?.skill || '',
          projectTitle: mission ? (projectMap.get(mission.project_id) || 'Project') : 'Project',
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
      toast.error('Ingresa el link de tu entrega');
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error('Ingresa una URL válida (ej: https://...)');
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
      toast.success('Entrega enviada correctamente');
      setDeliveryUrls((prev) => ({ ...prev, [appId]: '' }));
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la entrega');
    } finally {
      setSubmittingId(null);
    }
  };

  const completedCount = applications.filter((a) => a.status === 'completed').length;
  const activatedCount = applications.length;
  const inProgressCount = applications.filter((a) => a.status === 'pending' || a.status === 'delivered').length;
  const totalEarnings = applications
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.missionReward, 0);

  const currentLevel = levelConfig.reduce((lvl, l) => (completedCount >= l.threshold ? l : lvl), levelConfig[0]);
  const nextLevel = levelConfig[levelConfig.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel
    ? ((completedCount - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;

  const badges = [
    { name: 'Explorer', icon: Compass, earned: activatedCount >= 1 },
    { name: 'Specialist', icon: Star, earned: completedCount >= 5 },
    { name: 'Elite Operator', icon: Trophy, earned: completedCount >= 25 },
    { name: 'Speed Runner', icon: Zap, earned: completedCount >= 10 },
  ];

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'ACTIVADA',
      delivered: 'EN REVISIÓN',
      completed: 'COMPLETADA',
      rejected: 'RECHAZADA',
      funds_released: 'FONDOS LIBERADOS',
    };
    return map[status] || status.toUpperCase();
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-primary/10 text-primary',
      delivered: 'bg-yellow-500/10 text-yellow-500',
      completed: 'bg-green-500/10 text-green-500',
      rejected: 'bg-destructive/10 text-destructive',
      funds_released: 'bg-green-500/10 text-green-500',
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

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{t('explorer.title')}</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{user?.email}</p>
        </div>
        <Link to="/marketplace">
          <Button variant="hero" className="gap-2">
            <Compass className="h-4 w-4" /> {t('explorer.browse')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Compass} label={t('explorer.available')} value={String(activatedCount)} accent />
            <StatCard icon={Zap} label={t('explorer.in_progress')} value={String(inProgressCount)} />
            <StatCard icon={CheckCircle} label={t('explorer.completed')} value={String(completedCount)} />
            <StatCard icon={DollarSign} label={t('explorer.earnings')} value={`$${totalEarnings.toLocaleString()}`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="font-heading font-bold mb-4">{t('explorer.level')}</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="text-2xl font-heading font-black text-primary">
                    L{levelConfig.indexOf(currentLevel) + 1}
                  </span>
                </div>
                <div>
                  <p className="font-heading font-bold">{currentLevel.name}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    {completedCount} missions completed
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
              </div>
              {nextLevel && (
                <p className="text-xs text-muted-foreground mt-2 font-body">
                  {nextLevel.threshold - completedCount} more missions to reach {nextLevel.name}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="font-heading font-bold mb-4">Badges</h2>
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${badge.earned ? 'border-primary/30 bg-primary/5' : 'border-border/50 opacity-40'}`}>
                    <badge.icon className={`h-5 w-5 ${badge.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-heading font-semibold ${badge.earned ? '' : 'text-muted-foreground'}`}>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Balance & Withdrawals */}
          <div className="mb-8">
            <h2 className="font-heading font-bold mb-4">Balance & Retiros</h2>
            <BalanceModule />
          </div>

          <div className="rounded-xl border border-border/50 bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-heading font-bold">Mis Misiones</h2>
            </div>
            <div className="divide-y divide-border/50">
              {applications.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">
                  No hay misiones activadas. Explora el marketplace para encontrar misiones.
                </div>
              )}
              {applications.map((app) => (
                <div key={app.id} className="p-4 md:p-6 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-semibold">{app.missionTitle}</h3>
                      <p className="text-sm text-muted-foreground font-body">{app.projectTitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${statusColor(app.status)}`}>
                        {statusLabel(app.status)}
                      </span>
                      <span className="text-sm font-heading font-semibold text-primary">${app.missionReward.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Delivery section */}
                  {(app.status === 'pending' || app.status === 'rejected') && (
                    <div className="space-y-2">
                      {app.status === 'rejected' && app.review_note && (
                        <p className="text-sm text-destructive font-body italic">
                          Motivo del rechazo: {app.review_note}
                        </p>
                      )}
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="https://link-a-tu-trabajo.com"
                          value={deliveryUrls[app.id] || ''}
                          onChange={(e) => setDeliveryUrls((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          className="gap-1 font-heading text-xs"
                          onClick={() => handleSubmitDelivery(app.id)}
                          disabled={submittingId === app.id}
                        >
                          <Send className="h-3 w-3" />
                          {submittingId === app.id ? 'Enviando...' : app.status === 'rejected' ? 'Reenviar' : 'Entregar'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {app.status === 'delivered' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-sm font-heading font-semibold text-yellow-500">En revisión</span>
                      </div>
                      {app.delivery_url && (
                        <a href={app.delivery_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline font-body truncate">
                          <ExternalLink className="h-3 w-3" /> {app.delivery_url}
                        </a>
                      )}
                    </div>
                  )}

                  {(app.status === 'completed' || app.status === 'funds_released') && app.delivery_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <a href={app.delivery_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-body truncate">
                        {app.delivery_url}
                      </a>
                    </div>
                  )}

                  {app.review_note && app.status !== 'rejected' && (
                    <p className="text-sm text-muted-foreground font-body italic">
                      Nota de revisión: {app.review_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExplorerDashboard;
