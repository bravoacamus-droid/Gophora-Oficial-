import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  startedAt: string | null | undefined;
  deadlineHours: number;
  isEs: boolean;
  /** Hide the badge entirely once the assignment has reached a terminal state. */
  hidden?: boolean;
}

/**
 * Always-visible 72h countdown for an active mission. Re-renders every
 * 60 seconds. Color thresholds: green > 24h, amber 12-24h, red < 12h,
 * destructive on expired.
 */
export default function MissionCountdown({ startedAt, deadlineHours, isEs, hidden }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [hidden]);

  if (hidden) return null;
  if (!startedAt) {
    // Pre-activation — fallback to "72h al activar" label
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-heading font-bold text-muted-foreground">
        <Clock className="h-3 w-3" />
        {isEs ? `${deadlineHours}h al activar` : `${deadlineHours}h on activate`}
      </span>
    );
  }

  const startMs = new Date(startedAt).getTime();
  const deadlineMs = startMs + deadlineHours * 3600 * 1000;
  const remainingMs = deadlineMs - now;

  if (remainingMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-heading font-bold text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {isEs ? 'Plazo vencido' : 'Deadline passed'}
      </span>
    );
  }

  const totalMin = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  let tone: string;
  let pulse = '';
  if (hours >= 24) {
    tone = 'border-green-500/40 bg-green-500/10 text-green-600';
  } else if (hours >= 12) {
    tone = 'border-amber-500/40 bg-amber-500/10 text-amber-600';
  } else {
    tone = 'border-red-500/40 bg-red-500/10 text-red-500';
    pulse = 'animate-pulse';
  }

  const label = hours >= 1
    ? `${hours}h ${mins}m`
    : `${mins}m`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-heading font-bold ${tone} ${pulse}`}>
      <Clock className="h-3 w-3" />
      {isEs ? `${label} restantes` : `${label} left`}
    </span>
  );
}
