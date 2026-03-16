import { useLanguage } from '@/contexts/LanguageContext';
import { useEngagementData, getXPLevel } from '@/hooks/useEngagement';
import { Progress } from '@/components/ui/progress';
import { Flame, Zap, Calendar } from 'lucide-react';

const dayLabels = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
};

export default function StreakTracker() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data } = useEngagementData();

  if (!data) return null;

  const xpLevel = getXPLevel(data.totalXP);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      {/* Streak + XP row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-heading font-black text-primary leading-none">{data.streak}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">
              {isEs ? `racha de ${data.streak === 1 ? 'día' : 'días'}` : `day streak`}
            </p>
          </div>
        </div>

        {/* Today XP */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-heading font-black leading-none">{data.totalXP.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">XP {isEs ? 'total' : 'total'}</p>
          </div>
        </div>
      </div>

      {/* XP Level Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{xpLevel.icon}</span>
            <span className="text-xs font-heading font-bold">{isEs ? xpLevel.nameEs : xpLevel.name}</span>
            <span className="text-[10px] text-muted-foreground">Lv.{xpLevel.level}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-body">
            {data.totalXP} / {xpLevel.nextLevelXP} XP
          </span>
        </div>
        <Progress value={xpLevel.progress} className="h-2" />
      </div>

      {/* Weekly dots */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-body">
            {isEs ? 'Esta semana' : 'This week'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.weekActivity.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-md transition-all ${
                  day.active
                    ? 'bg-primary shadow-sm shadow-primary/20'
                    : 'bg-muted/50 border border-border/30'
                }`}
              />
              <span className="text-[9px] text-muted-foreground font-body">
                {(isEs ? dayLabels.es : dayLabels.en)[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak milestone */}
      {data.streak > 0 && (
        <div className="text-center pt-1">
          <p className="text-[10px] text-muted-foreground font-body">
            {data.nextMilestone - data.streak} {isEs ? 'días más para la racha de' : 'more days to'}{' '}
            <span className="font-semibold text-primary">{data.nextMilestone} {isEs ? 'días' : 'days'}</span> 🔥
          </p>
        </div>
      )}
    </div>
  );
}
