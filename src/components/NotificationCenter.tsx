// src/components/NotificationCenter.tsx
// CREATYNG — Notification dropdown in Topbar

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Sparkles, Check } from 'lucide-react';
import { useNotificationStore, type NotificationType } from '@/stores/useNotificationStore';
import { useI18n } from '@/i18n';

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  credit: Sparkles,
};

const COLOR_MAP: Record<NotificationType, string> = {
  success: '#22C55E',
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
  credit: '#F97316',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationCenter() {
  const { t } = useI18n();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = unreadCount();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9,
          border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
          cursor: 'pointer', flexShrink: 0, transition: 'background 150ms',
        }}
        title={t('notification.title')}
      >
        <Bell style={{ width: 16, height: 16, color: 'hsl(var(--muted-foreground))' }} />
        {count > 0 && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid hsl(var(--background) / 0.8)',
          }}>
            {count > 9 ? '9+' : count}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, maxHeight: 420, overflowY: 'auto',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          zIndex: 100,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border))',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              {t('notification.title')}
            </span>
            {count > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: '#F97316', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 500,
                }}
              >
                <Check style={{ width: 13, height: 13 }} />
                {t('notification.mark_all_read')}
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'hsl(var(--muted-foreground))', fontSize: 13,
            }}>
              {t('notification.empty')}
            </div>
          ) : (
            notifications.slice(0, 20).map((notif) => {
              const Icon = ICON_MAP[notif.type];
              const color = COLOR_MAP[notif.type];
              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 16px',
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: notif.read ? 'transparent' : 'hsl(var(--muted) / 0.5)',
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    transition: 'background 150ms',
                    border: 'none',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}15`,
                  }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: notif.read ? 400 : 600,
                      color: 'hsl(var(--foreground))',
                    }}>
                      {notif.title}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'hsl(var(--muted-foreground))',
                      marginTop: 2, lineHeight: 1.4,
                    }}>
                      {notif.message}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, color: 'hsl(var(--muted-foreground))',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {timeAgo(notif.createdAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
