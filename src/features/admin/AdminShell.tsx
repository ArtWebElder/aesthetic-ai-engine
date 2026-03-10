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

  return (
    <div className="min-h-screen flex w-full bg-[#141417]">
      {/* Fixed sidebar */}
      <aside className="shrink-0 h-screen sticky top-0 z-20">
        <AdminSidebar />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-6 border-b border-white/[0.06] sticky top-0 z-10 bg-[#141417]/80 backdrop-blur-sm">
          <h1 className="text-sm font-semibold text-white/80">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/30">Online</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white/70 text-xs font-semibold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
