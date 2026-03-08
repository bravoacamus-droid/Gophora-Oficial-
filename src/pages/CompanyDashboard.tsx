import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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

const CompanyDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FolderOpen} label={t('company.active_projects')} value="3" accent />
        <StatCard icon={Zap} label={t('company.missions_progress')} value="12" />
        <StatCard icon={CheckCircle} label={t('company.completed')} value="47" />
        <StatCard icon={DollarSign} label={t('company.budget')} value="$8,450" />
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border border-border/50 bg-card">
        <div className="p-6 border-b border-border/50">
          <h2 className="font-heading font-bold">Recent Projects</h2>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { name: 'E-commerce Redesign', missions: 8, completed: 5, budget: '$3,200' },
            { name: 'Marketing Campaign Q2', missions: 12, completed: 10, budget: '$2,800' },
            { name: 'Mobile App MVP', missions: 15, completed: 3, budget: '$5,000' },
          ].map((project, i) => (
            <div key={i} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
              <div>
                <h3 className="font-heading font-semibold">{project.name}</h3>
                <p className="text-sm text-muted-foreground font-body">{project.completed}/{project.missions} missions completed</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(project.completed / project.missions) * 100}%` }} />
                </div>
                <span className="text-sm font-heading font-semibold text-primary">{project.budget}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
