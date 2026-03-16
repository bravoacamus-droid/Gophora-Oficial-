import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEngagementData } from '@/hooks/useEngagement';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DailyMissions() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const { data } = useEngagementData();

  if (!data) return null;

  const completedCount = data.dailyMissions.filter(m => m.completed).length;
  const totalCount = data.dailyMissions.length;

  const actionRoutes: Record<string, string> = {
    academy: '/academy',
    marketplace: '/marketplace',
    exam: '/academy',
    passport: '/explorer',
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold text-sm">
            {isEs ? '🎯 Misiones Diarias' : '🎯 Daily Missions'}
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {completedCount}/{totalCount} {isEs ? 'completadas' : 'completed'} • +{data.dailyMissions.reduce((s, m) => s + m.xp, 0)} XP {isEs ? 'disponible' : 'available'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {data.dailyMissions.map((m, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${m.completed ? 'bg-primary scale-110' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {data.dailyMissions.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              mission.completed
                ? 'border-primary/20 bg-primary/5'
                : 'border-border/30 hover:border-primary/20 hover:bg-muted/30 cursor-pointer'
            }`}
            onClick={() => !mission.completed && navigate(actionRoutes[mission.action])}
          >
            <span className="text-lg shrink-0">{mission.completed ? '✅' : mission.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-heading font-semibold ${mission.completed ? 'line-through text-muted-foreground' : ''}`}>
                {isEs ? mission.titleEs : mission.title}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-heading font-bold ${mission.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                +{mission.xp} XP
              </span>
              {!mission.completed && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
