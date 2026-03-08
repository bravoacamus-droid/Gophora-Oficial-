import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Clock, DollarSign, User, Zap } from 'lucide-react';
import { toast } from 'sonner';

const skills = ['All', 'Design', 'Web Development', 'Marketing', 'Data', 'Research', 'Operations'];

interface MarketplaceMission {
  id: string;
  title: string;
  skill: string;
  hours: number;
  reward: number;
  project_id: string;
  projectTitle: string;
}

const Marketplace = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [missions, setMissions] = useState<MarketplaceMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingMissionId, setActivatingMissionId] = useState<string | null>(null);
  const [activatedMissionIds, setActivatedMissionIds] = useState<string[]>([]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      const { data: missionRows, error: missionsError } = await supabase
        .from('missions')
        .select('id, title, skill, hours, reward, project_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (missionsError) throw missionsError;

      const projectIds = [...new Set((missionRows || []).map((mission) => mission.project_id))];
      let projectMap = new Map<string, { title: string }>();

      if (projectIds.length > 0) {
        const { data: projectRows, error: projectsError } = await supabase
          .from('projects')
          .select('id, title')
          .in('id', projectIds);

        if (projectsError) throw projectsError;

        projectMap = new Map((projectRows || []).map((project) => [project.id, { title: project.title }]));
      }

      const mappedMissions = (missionRows || []).map((mission) => ({
        id: mission.id,
        title: mission.title,
        skill: mission.skill,
        hours: Number(mission.hours),
        reward: Number(mission.reward),
        project_id: mission.project_id,
        projectTitle: projectMap.get(mission.project_id)?.title || 'Proyecto',
      }));

      setMissions(mappedMissions);

      if (user) {
        const { data: applicationRows, error: applicationsError } = await supabase
          .from('mission_applications')
          .select('mission_id')
          .eq('user_id', user.id);

        if (applicationsError) throw applicationsError;

        setActivatedMissionIds((applicationRows || []).map((application) => application.mission_id));
      } else {
        setActivatedMissionIds([]);
      }
    } catch (err: any) {
      console.error('Marketplace load error:', err);
      toast.error(err.message || 'No se pudo cargar el marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [user]);

  const filtered = useMemo(() => {
    return missions.filter((mission) => {
      const matchSearch = mission.title.toLowerCase().includes(search.toLowerCase());
      const matchSkill = selectedSkill === 'All' || mission.skill === selectedSkill;
      return matchSearch && matchSkill;
    });
  }, [missions, search, selectedSkill]);

  const handleActivateMission = async (missionId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para activar una misión');
      return;
    }

    if (activatedMissionIds.includes(missionId)) {
      toast.success('Esta misión ya está activada');
      return;
    }

    setActivatingMissionId(missionId);
    try {
      const { error } = await supabase.from('mission_applications').insert({
        mission_id: missionId,
        user_id: user.id,
      });

      if (error) throw error;

      setActivatedMissionIds((prev) => [...prev, missionId]);
      toast.success('Misión activada correctamente');
    } catch (err: any) {
      console.error('Mission activation error:', err);
      toast.error(err.message || 'No se pudo activar la misión');
    } finally {
      setActivatingMissionId(null);
    }
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
            <div key={mission.id} className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {mission.skill}
                </span>
                <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-heading font-bold mb-3">{mission.title}</h3>
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mission.hours}h</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${mission.reward.toLocaleString()}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {mission.projectTitle}</span>
              </div>
              <Button
                className="w-full font-heading text-xs tracking-wide"
                size="sm"
                onClick={() => handleActivateMission(mission.id)}
                disabled={activated || activating}
              >
                {activating ? 'Activando...' : activated ? 'Misión activada' : t('marketplace.apply')}
              </Button>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground font-body">
          No hay misiones aprobadas disponibles por ahora.
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border/50 bg-card p-10 text-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
};

export default Marketplace;
