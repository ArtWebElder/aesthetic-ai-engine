import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Image,
  Zap,
  Bell,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';

const adminNavItems = [
  { labelKey: 'admin.overview', icon: LayoutDashboard, path: '/admin' },
  { labelKey: 'admin.users', icon: Users, path: '/admin/users' },
  { labelKey: 'admin.finance', icon: DollarSign, path: '/admin/finance' },
  { labelKey: 'admin.generations', icon: Image, path: '/admin/generations' },
  { labelKey: 'admin.tokens', icon: Zap, path: '/admin/tokens' },
  { labelKey: 'admin.notifications', icon: Bell, path: '/admin/notifications' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useI18n();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 210, background: 'hsl(var(--card))', borderRight: '1px solid hsl(var(--border))', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Brand */}
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,hsl(var(--brand)),hsl(var(--brand-2)))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'hsl(var(--brand-foreground))', fontWeight: 800, fontSize: 14 }}>C</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'hsl(var(--foreground))' }}>Creatyng</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#EF4444', textTransform: 'uppercase' }}>{t('admin.super_admin')}</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: '0 12px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        {adminNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                background: active ? 'hsl(var(--brand) / 0.16)' : 'transparent',
                border: active ? '1px solid hsl(var(--brand) / 0.2)' : '1px solid transparent',
                color: active ? 'hsl(var(--brand))' : 'hsl(var(--muted-foreground))', fontWeight: active ? 600 : 400,
                fontSize: 13, fontFamily: 'inherit', transition: 'all 150ms', position: 'relative', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: 'hsl(var(--brand))', borderRadius: '0 3px 3px 0' }} />
              )}
              <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '10px', borderTop: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => navigate('/app/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'hsl(var(--muted-foreground))', transition: 'all 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLButtonElement).style.color = '#5a5a60'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
        >
          <ArrowLeft style={{ width: 14, height: 14, flexShrink: 0 }} />
          {t('admin.back_to_app')}
        </button>
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#b5b5bb', transition: 'all 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#b5b5bb'; }}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          {t('admin.sign_out')}
        </button>
      </div>
    </div>
  );
}
