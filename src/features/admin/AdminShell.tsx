import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';

const MODULE_TITLE_KEYS: Record<string, string> = {
  '/admin': 'admin.overview',
  '/admin/users': 'admin.users',
  '/admin/finance': 'admin.finance',
  '/admin/generations': 'admin.generations',
  '/admin/tokens': 'admin.tokens',
  '/admin/notifications': 'admin.notifications',
};

export function AdminShell() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Close the drawer whenever the route changes (e.g. after picking a nav item)
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const titleKey = MODULE_TITLE_KEYS[location.pathname];
  const title = titleKey ? t(titleKey) : 'Admin';

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD';

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='hsl(var(--brand) / 0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', width: '100%', background: '#f5f5f3', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Sidebar — fixed on desktop, slide-in drawer on mobile */}
      {!isMobile && (
        <aside style={{ flexShrink: 0, height: '100vh', position: 'sticky', top: 0, zIndex: 20 }}>
          <AdminSidebar />
        </aside>
      )}
      {isMobile && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, height: '100dvh', zIndex: 50, boxShadow: '2px 0 18px rgba(0,0,0,0.18)' }}>
            <AdminSidebar />
          </aside>
        </>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 14px' : '0 28px', borderBottom: '1px solid rgba(20,20,23,0.06)',
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(245,245,243,0.85)', backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label={t('admin.menu')}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(20,20,23,0.1)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#141417', flexShrink: 0 }}
              >
                <Menu size={18} />
              </button>
            )}
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#141417' }}>{title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: 11.5, color: '#8e8e96' }}>{t('admin.online')}</span>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#EF4444,#141417)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11.5 }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '18px 16px 40px' : '24px 32px 48px', background: `${gridSvg}, #f5f5f3` }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
