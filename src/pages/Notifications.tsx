import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, ArrowLeft, Loader2, CheckCheck } from 'lucide-react';

const formatRelative = (iso: string, isEs: boolean) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return isEs ? 'ahora' : 'now';
  if (m < 60) return `${m}${isEs ? 'min' : 'm'}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}${isEs ? 'd' : 'd'}`;
  return new Date(iso).toLocaleString(isEs ? 'es' : 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const iconForType = (type: string) => {
  switch (type) {
    case 'milestone': return '🎉';
    case 'playbook_completion': return '📘';
    case 'mission_taken': return '🚀';
    case 'mission_delivered': return '📦';
    case 'mission_approved': return '✅';
    case 'mission_rejected': return '❌';
    case 'funds_released': return '💰';
    case 'mission_completed': return '🎯';
    case 'tutor_application': return '🧑‍🏫';
    case 'tutor_approved': return '🎓';
    case 'tutor_rejected': return '⚠️';
    case 'tutor_revoked': return '🚫';
    case 'new_project': return '📁';
    case 'withdrawal_requested': return '💵';
    case 'withdrawal_approved': return '💸';
    case 'withdrawal_rejected': return '🔻';
    case 'investor_offer_received': return '💎';
    case 'investor_offer_accepted': return '🤝';
    case 'investor_offer_declined': return '👋';
    case 'investor_agreement_signed': return '✍️';
    default: return '🔔';
  }
};

const NotificationsPage = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {isEs ? 'Notificaciones' : 'Notifications'}
            </h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {notifications.length === 0
                ? (isEs ? 'Todavía no tenés notificaciones.' : 'No notifications yet.')
                : `${notifications.length} ${isEs ? 'totales' : 'total'} · ${unreadCount} ${isEs ? 'sin leer' : 'unread'}`}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-heading"
            onClick={() => markRead.mutate(undefined)}
            disabled={markRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {isEs ? 'Marcar todas como leídas' : 'Mark all as read'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 p-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {isEs
              ? 'Cuando recibas notificaciones (entregas, aprobaciones, ofertas, etc.) aparecerán acá.'
              : "You'll see notifications here when you receive them — deliveries, approvals, offers, etc."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
          {notifications.map((n) => {
            const title = isEs && n.title_es ? n.title_es : n.title;
            const body = isEs && n.body_es ? n.body_es : (n.body || '');
            const isUnread = !n.read_at;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (n.link) navigate(n.link);
                }}
                className={`w-full text-left p-4 hover:bg-muted/40 transition-colors flex gap-3 ${isUnread ? 'bg-primary/5' : ''}`}
              >
                <span className="text-xl shrink-0 mt-0.5">{iconForType(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-heading font-semibold text-sm truncate">{title}</p>
                    {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  {body && (
                    <p className="text-xs text-muted-foreground font-body leading-relaxed">{body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-body mt-1.5">
                    {formatRelative(n.created_at, isEs)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
