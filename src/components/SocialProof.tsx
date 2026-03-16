import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformStats } from '@/hooks/useEngagement';
import { Users, BookOpen, Target, TrendingUp } from 'lucide-react';

export default function SocialProof() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data } = usePlatformStats();

  if (!data) return null;

  const stats = [
    {
      icon: Users,
      value: data.activeToday,
      label: isEs ? 'exploradores activos hoy' : 'explorers active today',
    },
    {
      icon: BookOpen,
      value: data.totalCoursesCompleted,
      label: isEs ? 'cursos completados' : 'courses completed',
    },
    {
      icon: Target,
      value: data.totalMissionsCompleted,
      label: isEs ? 'misiones completadas' : 'missions completed',
    },
    {
      icon: TrendingUp,
      value: data.totalExplorers,
      label: isEs ? 'exploradores registrados' : 'registered explorers',
    },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <h3 className="font-heading font-bold text-xs mb-3 text-muted-foreground uppercase tracking-wider">
        {isEs ? '🌐 Comunidad GOPHORA' : '🌐 GOPHORA Community'}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg">
            <stat.icon className="h-3.5 w-3.5 text-primary shrink-0" />
            <div>
              <span className="text-sm font-heading font-bold">{stat.value.toLocaleString()}</span>
              <p className="text-[9px] text-muted-foreground font-body leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
