import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Zap, CheckCircle, DollarSign, Plus } from 'lucide-react';

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
  status: string;
  project_id: string;
}

const CompanyDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: projectRows } = await supabase
        .from('projects')
        .select('id, title, budget, status, payment_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const pRows = projectRows || [];
      setProjects(pRows);

      if (pRows.length > 0) {
        const projectIds = pRows.map((p) => p.id);
        const { data: missionRows } = await supabase
          .from('missions')
          .select('id, status, project_id')
          .in('project_id', projectIds);
        setMissions(missionRows || []);
      } else {
        setMissions([]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedMissions = missions.filter((m) => m.status === 'approved').length;
  const inProgressMissions = missions.filter((m) => m.status === 'open').length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const projectsWithMissions = projects.map((p) => {
    const pMissions = missions.filter((m) => m.project_id === p.id);
    const completed = pMissions.filter((m) => m.status === 'approved').length;
    return { ...p, totalMissions: pMissions.length, completedMissions: completed };
  });

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

          <div className="rounded-xl border border-border/50 bg-card">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-heading font-bold">Recent Projects</h2>
            </div>
            <div className="divide-y divide-border/50">
              {projectsWithMissions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-body">
                  No projects yet. Create your first project to get started.
                </div>
              )}
              {projectsWithMissions.map((project) => (
                <div key={project.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="font-heading font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {project.completedMissions}/{project.totalMissions} missions completed
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
