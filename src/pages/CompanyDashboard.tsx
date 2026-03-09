import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Zap, CheckCircle, DollarSign, Plus, ExternalLink, CheckCircle2, XCircle, Wallet, TrendingDown, ChevronRight, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProjectRow {
  id: string;
  title: string;
  budget: number;
  status: string;
  payment_status: string;
  description: string;
  category: string;
  priority: string;
  deadline: string | null;
  resource_link: string | null;
  created_at: string;
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
  explorerName: string;
  missionTitle: string;
  missionReward: number;
  projectTitle: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  user_id: string;
  mission_id: string;
  explorerName: string;
}

const StatCard = ({ icon: Icon, label, value, accent = false, onClick }: { icon: any; label: string; value: string; accent?: boolean; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`rounded-xl border p-6 transition-all hover:border-primary/30 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card'} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${accent ? 'bg-primary/20' : 'bg-muted'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <span className="text-sm text-muted-foreground font-body">{label}</span>
    </div>
    <div className="text-3xl font-heading font-bold">{value}</div>
  </div>
);

const CompanyDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [editingResourceLink, setEditingResourceLink] = useState<string>('');
  const [savingResource, setSavingResource] = useState(false);

  // Dialogs
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [statDialog, setStatDialog] = useState<'active' | 'progress' | 'completed' | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: projectRows } = await supabase
      .from('projects')
      .select('id, title, budget, status, payment_status, description, category, priority, deadline, resource_link, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const pRows = (projectRows || []) as ProjectRow[];
    setProjects(pRows);

    if (pRows.length > 0) {
      const projectIds = pRows.map((p) => p.id);

      const { data: missionRows } = await supabase
        .from('missions')
        .select('id, title, status, project_id, reward, skill')
        .in('project_id', projectIds);

      const mRows = (missionRows || []) as MissionRow[];
      setMissions(mRows);

      if (mRows.length > 0) {
        const missionIds = mRows.map((m) => m.id);
        const { data: appRows } = await supabase
          .from('mission_applications')
          .select('id, status, delivery_url, delivered_at, mission_id, user_id')
          .in('mission_id', missionIds);

        const apps = appRows || [];
        const userIds = [...new Set(apps.map((a) => a.user_id))];

        let profileMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', userIds);
          profileMap = new Map((profileRows || []).map((p: any) => [p.id, p.username || p.full_name || 'Explorer']));
        }

        const missionMap = new Map(mRows.map((m) => [m.id, m]));
        const projectMap = new Map(pRows.map((p) => [p.id, p.title]));

        const deliveryApps = apps.filter((a) => ['delivered', 'completed', 'rejected'].includes(a.status));
        const mapped: DeliveryRow[] = deliveryApps.map((a) => {
          const mission = missionMap.get(a.mission_id);
          return {
            id: a.id,
            status: a.status,
            delivery_url: a.delivery_url,
            delivered_at: a.delivered_at,
            mission_id: a.mission_id,
            user_id: a.user_id,
            explorerName: profileMap.get(a.user_id) || 'Explorer',
            missionTitle: mission?.title || 'Mission',
            missionReward: Number(mission?.reward || 0),
            projectTitle: mission ? (projectMap.get(mission.project_id) || 'Project') : 'Project',
          };
        });
        setDeliveries(mapped);

        const allApps: ApplicationRow[] = apps.map((a) => ({
          id: a.id,
          status: a.status,
          user_id: a.user_id,
          mission_id: a.mission_id,
          explorerName: profileMap.get(a.user_id) || 'Explorer',
        }));
        setApplications(allApps);
      } else {
        setDeliveries([]);
        setApplications([]);
      }
    } else {
      setMissions([]);
      setDeliveries([]);
      setApplications([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleReview = async (appId: string, newStatus: 'completed' | 'rejected') => {
    setReviewingId(appId);
    try {
      const { error } = await supabase
        .from('mission_applications')
        .update({ status: newStatus, reviewed_at: new Date().toISOString(), review_note: reviewNotes[appId] || null })
        .eq('id', appId);
      if (error) throw error;
      toast.success(newStatus === 'completed' ? 'Entrega aprobada' : 'Entrega rechazada');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al revisar');
    } finally {
      setReviewingId(null);
    }
  };

  const handleUpdateResource = async (projectId: string) => {
    setSavingResource(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ resource_link: editingResourceLink })
        .eq('id', projectId);
      if (error) throw error;
      toast.success('Recursos actualizados');
      setSelectedProject((prev) => prev ? { ...prev, resource_link: editingResourceLink } : null);
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, resource_link: editingResourceLink } : p));
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setSavingResource(false);
    }
  };

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedMissions = missions.filter((m) => m.status === 'approved');
  const inProgressMissions = missions.filter((m) => m.status === 'open');
  const totalBudget = missions.reduce((sum, m) => sum + Number(m.reward || 0), 0);
  const usedBudget = missions.filter(m => m.status === 'completed').reduce((sum, m) => sum + Number(m.reward || 0), 0);
  const balance = totalBudget - usedBudget;

  const pendingDeliveries = deliveries.filter((d) => d.status === 'delivered');

  const getMissionsForProject = (projectId: string) => missions.filter((m) => m.project_id === projectId);
  const getAppsForProject = (projectId: string) => {
    const mIds = getMissionsForProject(projectId).map((m) => m.id);
    return applications.filter((a) => mIds.includes(a.mission_id));
  };

  const getStatDialogItems = () => {
    if (statDialog === 'active') {
      return activeProjects.map((p) => {
        const pMissions = getMissionsForProject(p.id);
        return { title: p.title, detail: `${pMissions.length} misiones • $${Number(p.budget).toLocaleString()}`, status: p.payment_status, project: p };
      });
    }
    if (statDialog === 'progress') {
      return inProgressMissions.map((m) => {
        const pTitle = projects.find((p) => p.id === m.project_id)?.title || '';
        const activeApps = applications.filter((a) => a.mission_id === m.id && ['accepted', 'delivered'].includes(a.status));
        return { title: m.title, detail: `${pTitle} • ${m.skill} • $${Number(m.reward).toLocaleString()} • ${activeApps.length} exploradores`, status: m.status };
      });
    }
    if (statDialog === 'completed') {
      return completedMissions.map((m) => {
        const pTitle = projects.find((p) => p.id === m.project_id)?.title || '';
        return { title: m.title, detail: `${pTitle} • ${m.skill} • $${Number(m.reward).toLocaleString()}`, status: 'approved' };
      });
    }
    return [];
  };

  const statDialogTitle = statDialog === 'active' ? 'Proyectos Activos' : statDialog === 'progress' ? 'Misiones en Progreso' : 'Misiones Completadas';

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
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={FolderOpen} label="Proyectos Activos" value={String(activeProjects.length)} accent onClick={() => setStatDialog('active')} />
            <StatCard icon={Zap} label="En Progreso" value={String(inProgressMissions.length)} onClick={() => setStatDialog('progress')} />
            <StatCard icon={CheckCircle} label="Completadas" value={String(completedMissions.length)} onClick={() => setStatDialog('completed')} />
            <StatCard icon={DollarSign} label="Presupuesto" value={`$${totalBudget.toLocaleString()}`} />
            <StatCard icon={TrendingDown} label="Usado" value={`$${usedBudget.toLocaleString()}`} />
            <StatCard icon={Wallet} label="Saldo" value={`$${balance.toLocaleString()}`} accent />
          </div>

          {/* Pending Deliveries */}
          {pendingDeliveries.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
              <div className="p-6 border-b border-yellow-500/20">
                <h2 className="font-heading font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Entregas pendientes ({pendingDeliveries.length})
                </h2>
              </div>
              <div className="divide-y divide-yellow-500/10">
                {pendingDeliveries.map((d) => (
                  <div key={d.id} className="p-4 md:p-6 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-semibold">{d.missionTitle}</h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {d.projectTitle} • Explorer: <span className="text-primary font-semibold">@{d.explorerName}</span>
                        </p>
                      </div>
                      <span className="text-sm font-heading font-semibold text-primary">${d.missionReward.toLocaleString()}</span>
                    </div>
                    {d.delivery_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <a href={d.delivery_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-body truncate">{d.delivery_url}</a>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <Input placeholder="Nota de revisión (opcional)" value={reviewNotes[d.id] || ''} onChange={(e) => setReviewNotes((prev) => ({ ...prev, [d.id]: e.target.value }))} className="flex-1 text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1 font-heading text-xs" onClick={() => handleReview(d.id, 'completed')} disabled={reviewingId === d.id}>
                          <CheckCircle2 className="h-3 w-3" /> Aprobar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 font-heading text-xs text-destructive border-destructive/30" onClick={() => handleReview(d.id, 'rejected')} disabled={reviewingId === d.id}>
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
              {projects.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">No hay proyectos aún.</div>
              )}
              {projects.map((project) => {
                const pMissions = getMissionsForProject(project.id);
                const completed = pMissions.filter((m) => m.status === 'approved').length;
                return (
                  <div
                    key={project.id}
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedProject(project); setEditingResourceLink(project.resource_link || ''); }}
                  >
                    <div>
                      <h3 className="font-heading font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground font-body">{completed}/{pMissions.length} misiones completadas</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pMissions.length > 0 ? (completed / pMissions.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-heading font-semibold text-primary">${Number(project.budget).toLocaleString()}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Project Detail Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProject && (() => {
            const pMissions = getMissionsForProject(selectedProject.id);
            const pApps = getAppsForProject(selectedProject.id);
            const completedM = pMissions.filter((m) => m.status === 'approved').length;
            const pendingM = pMissions.filter((m) => m.status === 'open').length;
            const uniqueExplorers = new Set(pApps.filter((a) => ['accepted', 'delivered', 'completed'].includes(a.status)).map((a) => a.user_id));
            const pUsed = pMissions.filter((m) => m.status === 'approved').reduce((s, m) => s + Number(m.reward), 0);
            const totalMissionsReward = pMissions.reduce((s, m) => s + Number(m.reward), 0);
            const budgetMatch = totalMissionsReward === Number(selectedProject.budget);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">{selectedProject.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground font-body">{selectedProject.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-xs text-muted-foreground font-body">Presupuesto aprobado</span>
                      <p className="font-heading font-bold text-lg">${Number(selectedProject.budget).toLocaleString()}</p>
                    </div>
                    <div className={`rounded-lg border p-3 ${budgetMatch ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                      <span className="text-xs text-muted-foreground font-body">Total misiones</span>
                      <p className={`font-heading font-bold text-lg ${budgetMatch ? 'text-primary' : 'text-destructive'}`}>${totalMissionsReward.toLocaleString()}</p>
                      {!budgetMatch && (
                        <p className="text-xs text-destructive mt-1">
                          {totalMissionsReward > Number(selectedProject.budget) ? `Excede por $${(totalMissionsReward - Number(selectedProject.budget)).toLocaleString()}` : `Faltan $${(Number(selectedProject.budget) - totalMissionsReward).toLocaleString()}`}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-xs text-muted-foreground font-body">Usado (completadas)</span>
                      <p className="font-heading font-bold text-lg">${pUsed.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-xs text-muted-foreground font-body">Completadas</span>
                      <p className="font-heading font-bold text-lg text-primary">{completedM}/{pMissions.length}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-xs text-muted-foreground font-body">Pendientes</span>
                      <p className="font-heading font-bold text-lg">{pendingM}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3">
                      <span className="text-xs text-muted-foreground font-body">Exploradores</span>
                      <p className="font-heading font-bold text-lg">{uniqueExplorers.size}</p>
                    </div>
                  </div>

                  {/* Resource link section with edit */}
                  <div className="rounded-lg border border-border/50 p-4 space-y-3">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" /> Recursos del proyecto
                    </h3>
                    {selectedProject.resource_link && (
                      <a href={selectedProject.resource_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-body block truncate">
                        {selectedProject.resource_link}
                      </a>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nuevo link de recursos (Google Drive, Dropbox, etc.)"
                        value={editingResourceLink}
                        onChange={(e) => setEditingResourceLink(e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateResource(selectedProject.id)}
                        disabled={savingResource || !editingResourceLink.trim()}
                        className="font-heading text-xs"
                      >
                        {savingResource ? 'Guardando...' : 'Actualizar'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading font-semibold text-sm mb-2">Misiones ({pMissions.length}) — Total: ${totalMissionsReward.toLocaleString()}</h3>
                    <div className="space-y-2">
                      {pMissions.map((m) => {
                        const mApps = pApps.filter((a) => a.mission_id === m.id);
                        const activeExplorers = mApps.filter((a) => ['accepted', 'delivered', 'completed'].includes(a.status));
                        return (
                          <div key={m.id} className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                            <div>
                              <p className="font-heading font-semibold text-sm">{m.title}</p>
                              <p className="text-xs text-muted-foreground">{m.skill} • {activeExplorers.length > 0 ? activeExplorers.map((a) => `@${a.explorerName}`).join(', ') : 'Sin asignar'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-heading ${m.status === 'approved' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{m.status}</span>
                              <span className="text-sm font-heading font-semibold">${Number(m.reward).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground font-body flex gap-4 flex-wrap">
                    <span>Categoría: {selectedProject.category}</span>
                    <span>Prioridad: {selectedProject.priority}</span>
                    {selectedProject.deadline && <span>Deadline: {selectedProject.deadline}</span>}
                    <span>Creado: {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Stat Detail Dialog */}
      <Dialog open={!!statDialog} onOpenChange={() => setStatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{statDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {getStatDialogItems().length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay elementos</p>
            )}
            {getStatDialogItems().map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => {
                  if ('project' in item && item.project) {
                    setStatDialog(null);
                    setSelectedProject(item.project as ProjectRow);
                  }
                }}
              >
                <p className="font-heading font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground font-body">{item.detail}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDashboard;
