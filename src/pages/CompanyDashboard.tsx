import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Zap, CheckCircle, DollarSign, Plus, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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

interface ProjectRow {
  id: string;
  title: string;
  budget: number;
  status: string;
  payment_status: string;
}

interface MissionRow {
  id: string;
  title: string;
  status: string;
  project_id: string;
  reward: number;
  skill: string;
}

interface DeliveryRow {
  id: string;
  status: string;
  delivery_url: string | null;
  delivered_at: string | null;
  mission_id: string;
  user_id: string;
  explorerEmail: string;
  missionTitle: string;
  missionReward: number;
  projectTitle: string;
}

const CompanyDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: projectRows, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, budget, status, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) console.error('Projects load error:', projectsError);

    const pRows = projectRows || [];
    setProjects(pRows);

    if (pRows.length > 0) {
      const projectIds = pRows.map((p) => p.id);

      const { data: missionRows } = await supabase
        .from('missions')
        .select('id, title, status, project_id, reward, skill')
        .in('project_id', projectIds);

      const mRows = missionRows || [];
      setMissions(mRows);

      // Load deliveries for these missions
      if (mRows.length > 0) {
        const missionIds = mRows.map((m) => m.id);
        const { data: appRows } = await supabase
          .from('mission_applications')
          .select('id, status, delivery_url, delivered_at, mission_id, user_id')
          .in('mission_id', missionIds)
          .in('status', ['delivered', 'completed', 'rejected']);

        const apps = appRows || [];

        if (apps.length > 0) {
          const userIds = [...new Set(apps.map((a) => a.user_id))];
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);

          const profileMap = new Map((profileRows || []).map((p) => [p.id, p.email || '']));
          const missionMap = new Map(mRows.map((m) => [m.id, m]));
          const projectMap = new Map(pRows.map((p) => [p.id, p.title]));

          const mapped: DeliveryRow[] = apps.map((a) => {
            const mission = missionMap.get(a.mission_id);
            return {
              id: a.id,
              status: a.status,
              delivery_url: a.delivery_url,
              delivered_at: a.delivered_at,
              mission_id: a.mission_id,
              user_id: a.user_id,
              explorerEmail: profileMap.get(a.user_id) || '',
              missionTitle: mission?.title || 'Mission',
              missionReward: Number(mission?.reward || 0),
              projectTitle: mission ? (projectMap.get(mission.project_id) || 'Project') : 'Project',
            };
          });
          setDeliveries(mapped);
        } else {
          setDeliveries([]);
        }
      }
    } else {
      setMissions([]);
      setDeliveries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleReview = async (appId: string, newStatus: 'completed' | 'rejected') => {
    setReviewingId(appId);
    try {
      const { error } = await supabase
        .from('mission_applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNotes[appId] || null,
        })
        .eq('id', appId);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? 'Entrega aprobada' : 'Entrega rechazada');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al revisar la entrega');
    } finally {
      setReviewingId(null);
    }
  };

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedMissions = missions.filter((m) => m.status === 'approved').length;
  const inProgressMissions = missions.filter((m) => m.status === 'open').length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const projectsWithMissions = projects.map((p) => {
    const pMissions = missions.filter((m) => m.project_id === p.id);
    const completed = pMissions.filter((m) => m.status === 'approved').length;
    return { ...p, totalMissions: pMissions.length, completedMissions: completed };
  });

  const pendingDeliveries = deliveries.filter((d) => d.status === 'delivered');
  const reviewedDeliveries = deliveries.filter((d) => d.status === 'completed' || d.status === 'rejected');

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{t('company.title')}</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{user?.email}</p>
        </div>
        <Link to="/projects/create">
          <Button variant="hero" className="gap-2">
            <Plus className="h-4 w-4" /> {t('company.create_project')}
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
            <StatCard icon={FolderOpen} label={t('company.active_projects')} value={String(activeProjects)} accent />
            <StatCard icon={Zap} label={t('company.missions_progress')} value={String(inProgressMissions)} />
            <StatCard icon={CheckCircle} label={t('company.completed')} value={String(completedMissions)} />
            <StatCard icon={DollarSign} label={t('company.budget')} value={`$${totalBudget.toLocaleString()}`} />
          </div>

          {/* Pending Deliveries */}
          {pendingDeliveries.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
              <div className="p-6 border-b border-yellow-500/20">
                <h2 className="font-heading font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Entregas pendientes de revisión ({pendingDeliveries.length})
                </h2>
              </div>
              <div className="divide-y divide-yellow-500/10">
                {pendingDeliveries.map((d) => (
                  <div key={d.id} className="p-4 md:p-6 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-semibold">{d.missionTitle}</h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {d.projectTitle} • Explorer: {d.explorerEmail}
                        </p>
                      </div>
                      <span className="text-sm font-heading font-semibold text-primary">${d.missionReward.toLocaleString()}</span>
                    </div>

                    {d.delivery_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <a href={d.delivery_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-body truncate">
                          {d.delivery_url}
                        </a>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <Input
                        placeholder="Nota de revisión (opcional)"
                        value={reviewNotes[d.id] || ''}
                        onChange={(e) => setReviewNotes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        className="flex-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 font-heading text-xs"
                          onClick={() => handleReview(d.id, 'completed')}
                          disabled={reviewingId === d.id}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 font-heading text-xs text-destructive border-destructive/30"
                          onClick={() => handleReview(d.id, 'rejected')}
                          disabled={reviewingId === d.id}
                        >
                          <XCircle className="h-3 w-3" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="rounded-xl border border-border/50 bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-heading font-bold">Proyectos recientes</h2>
            </div>
            <div className="divide-y divide-border/50">
              {projectsWithMissions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">
                  No hay proyectos aún. Crea tu primer proyecto para comenzar.
                </div>
              )}
              {projectsWithMissions.map((project) => (
                <div key={project.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="font-heading font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {project.completedMissions}/{project.totalMissions} misiones completadas
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${project.totalMissions > 0 ? (project.completedMissions / project.totalMissions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-heading font-semibold text-primary">${Number(project.budget).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyDashboard;
