import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIRecommendations } from '@/hooks/useRecommendations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, Star } from 'lucide-react';

export default function SmartRecommendations() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data: recommendations, isLoading } = useAIRecommendations();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-heading font-bold">{isEs ? 'Analizando tu perfil...' : 'Analyzing your profile...'}</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = (recommendations || []).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-heading font-bold text-sm">
            {isEs ? 'Recomendado para ti' : 'Recommended for You'}
          </h2>
        </div>
        <Link to="/academy">
          <Button variant="ghost" size="sm" className="text-xs font-heading gap-1 h-7">
            {isEs ? 'Ver todo' : 'See all'} <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((rec) => (
          <Link key={rec.course_id} to="/academy" className="block">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card hover:border-primary/20 hover:bg-muted/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-semibold truncate group-hover:text-primary transition-colors">
                  {isEs ? (rec.course.title_es || rec.course.title) : rec.course.title}
                </p>
                <p className="text-[10px] text-muted-foreground font-body truncate">
                  {isEs ? rec.reason_es : rec.reason}
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">
                {rec.course.skill_level}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
