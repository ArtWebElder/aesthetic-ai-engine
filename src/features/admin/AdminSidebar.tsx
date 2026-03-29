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

const adminNavItems = [
  { labelKey: 'admin.overview', icon: LayoutDashboard, path: '/admin' },
  { labelKey: 'admin.users', icon: Users, path: '/admin/users' },
  { labelKey: 'admin.finance', icon: DollarSign, path: '/admin/finance' },
  { labelKey: 'admin.generations', icon: Image, path: '/admin/generations' },
  { labelKey: 'admin.tokens', icon: Zap, path: '/admin/tokens' },
  { labelKey: 'admin.notifications', icon: Bell, path: '/admin/notifications' },
];

const LABELS: Record<string, string> = {
  'admin.overview': 'Visão Geral',
  'admin.users': 'Usuários',
  'admin.finance': 'Financeiro',
  'admin.generations': 'Gerações',
  'admin.tokens': 'Tokens',
  'admin.notifications': 'Notificações',
};

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 210, background: '#ffffff', borderRight: '1px solid rgba(20,20,23,0.06)', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Brand */}
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>C</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#141417' }}>Creatyng</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#EF4444', textTransform: 'uppercase' }}>Super Admin</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(20,20,23,0.06)', margin: '0 12px' }} />

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
                background: active ? '#FFF0EA' : 'transparent',
                border: active ? '1px solid rgba(255,113,61,0.2)' : '1px solid transparent',
                color: active ? '#ff713d' : '#5a5a60', fontWeight: active ? 600 : 400,
                fontSize: 13, fontFamily: 'inherit', transition: 'all 150ms', position: 'relative', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,20,23,0.03)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#ff713d', borderRadius: '0 3px 3px 0' }} />
              )}
              <item.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {LABELS[item.labelKey]}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(20,20,23,0.06)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => navigate('/app/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#8e8e96', transition: 'all 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,20,23,0.03)'; (e.currentTarget as HTMLButtonElement).style.color = '#5a5a60'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8e8e96'; }}
        >
          <ArrowLeft style={{ width: 14, height: 14, flexShrink: 0 }} />
          Voltar ao App
        </button>
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#b5b5bb', transition: 'all 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,20,23,0.03)'; (e.currentTarget as HTMLButtonElement).style.color = '#8e8e96'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#b5b5bb'; }}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          Sair
        </button>
      </div>
    </div>
  );
}
