import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/features/auth/AuthProvider';

const MODULE_TITLES: Record<string, string> = {
  '/admin': 'Visão Geral',
  '/admin/users': 'Usuários',
  '/admin/finance': 'Financeiro',
  '/admin/generations': 'Gerações',
  '/admin/tokens': 'Tokens',
};

export function AdminShell() {
  const location = useLocation();
  const { user } = useAuth();

  const title = MODULE_TITLES[location.pathname] ?? 'Admin';

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD';

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', width: '100%', background: '#f5f5f3', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Fixed sidebar */}
      <aside style={{ flexShrink: 0, height: '100vh', position: 'sticky', top: 0, zIndex: 20 }}>
        <AdminSidebar />
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', borderBottom: '1px solid rgba(20,20,23,0.06)',
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(245,245,243,0.85)', backdropFilter: 'blur(16px)',
        }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#141417' }}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: 11.5, color: '#8e8e96' }}>Online</span>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#EF4444,#141417)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11.5 }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px', background: `${gridSvg}, #f5f5f3` }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
