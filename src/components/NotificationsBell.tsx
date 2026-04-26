import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationsRead,
  type AppNotification,
} from '@/hooks/useNotifications';
import { useState } from 'react';

const formatRelative = (iso: string, isEs: boolean) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return isEs ? 'ahora' : 'now';
  if (m < 60) return `${m}${isEs ? 'min' : 'm'}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${isEs ? 'h' : 'h'}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}${isEs ? 'd' : 'd'}`;
  return new Date(iso).toLocaleDateString(isEs ? 'es' : 'en');
};

const iconForType = (type: string) => {
  if (type === 'milestone') return '🎉';
  if (type === 'playbook_completion') return '📘';
  return '🔔';
};

const NotificationsBell = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationsRead();

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next && unread > 0) {
      // Mark everything as read when the popover opens. Background mutation —
      // user doesn't have to wait.
      markRead.mutate(undefined);
    }
  };

  const handleClickNotification = (n: AppNotification) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={isEs ? 'Notificaciones' : 'Notifications'}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="font-heading font-bold text-sm">
            {isEs ? 'Notificaciones' : 'Notifications'}
          </span>
          {unread > 0 && (
            <span className="text-[10px] font-heading font-semibold text-primary uppercase tracking-widest">
              {unread} {isEs ? 'nuevas' : 'new'}
            </span>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-body">
                {isEs ? 'No hay notificaciones aún.' : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {notifications.map((n) => {
                const title = isEs && n.title_es ? n.title_es : n.title;
                const body = isEs && n.body_es ? n.body_es : (n.body || '');
                const isUnread = !n.read_at;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClickNotification(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex gap-3 ${isUnread ? 'bg-primary/5' : ''}`}
                    >
                      <span className="text-base shrink-0 mt-0.5">{iconForType(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-semibold text-xs truncate">{title}</p>
                          {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        {body && (
                          <p className="text-[11px] text-muted-foreground font-body line-clamp-2 mt-0.5">{body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-body mt-1">
                          {formatRelative(n.created_at, isEs)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
