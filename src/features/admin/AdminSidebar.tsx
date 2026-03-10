import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Image,
  Zap,
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
];

const LABELS: Record<string, string> = {
  'admin.overview': 'Visão Geral',
  'admin.users': 'Usuários',
  'admin.finance': 'Financeiro',
  'admin.generations': 'Gerações',
  'admin.tokens': 'Tokens',
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
    <div className="flex flex-col h-full w-[220px] bg-[#141417] border-r border-white/[0.06]">
      {/* Brand */}
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff713d] to-[#FF9B70] flex items-center justify-center shrink-0">
          <span className="text-white font-extrabold text-sm">C</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-sm">Creatyng</span>
          <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">Super Admin</span>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {adminNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 text-left relative ${
                active
                  ? 'bg-white/[0.06] text-white font-medium'
                  : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#ff713d] rounded-r-full" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {LABELS[item.labelKey]}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <button
          onClick={() => navigate('/app/dashboard')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Voltar ao App
        </button>
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  );
}
