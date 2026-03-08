import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, Zap, CheckCircle, DollarSign, Star, Trophy } from 'lucide-react';

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

const badges = [
  { name: 'Explorer', icon: Compass, earned: true },
  { name: 'Specialist', icon: Star, earned: true },
  { name: 'Elite Operator', icon: Trophy, earned: false },
  { name: 'Speed Runner', icon: Zap, earned: false },
];

const ExplorerDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Compass} label={t('explorer.available')} value="24" accent />
        <StatCard icon={Zap} label={t('explorer.in_progress')} value="2" />
        <StatCard icon={CheckCircle} label={t('explorer.completed')} value="18" />
        <StatCard icon={DollarSign} label={t('explorer.earnings')} value="$2,340" />
      </div>

      {/* Explorer Level & Badges */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="font-heading font-bold mb-4">{t('explorer.level')}</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-2xl font-heading font-black text-primary">L3</span>
            </div>
            <div>
              <p className="font-heading font-bold">Specialist</p>
              <p className="text-sm text-muted-foreground font-body">18 missions completed • 94% success rate</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-body">7 more missions to reach Elite Operator</p>
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

      {/* Recent Missions */}
      <div className="rounded-xl border border-border/50 bg-card">
        <div className="p-6 border-b border-border/50">
          <h2 className="font-heading font-bold">Recent Missions</h2>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { name: 'Design Landing Page Header', client: 'TechCorp', reward: '$120', rating: 5, status: 'Completed' },
            { name: 'API Integration Module', client: 'StartupXYZ', reward: '$250', rating: null, status: 'In Progress' },
            { name: 'User Research Survey', client: 'AgencyPro', reward: '$80', rating: 4, status: 'Completed' },
          ].map((mission, i) => (
            <div key={i} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
              <div>
                <h3 className="font-heading font-semibold">{mission.name}</h3>
                <p className="text-sm text-muted-foreground font-body">{mission.client}</p>
              </div>
              <div className="flex items-center gap-4">
                {mission.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: mission.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 text-primary fill-primary" />
                    ))}
                  </div>
                )}
                <span className={`text-xs font-heading font-semibold px-2 py-1 rounded-full ${mission.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                  {mission.status}
                </span>
                <span className="text-sm font-heading font-semibold text-primary">{mission.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorerDashboard;
