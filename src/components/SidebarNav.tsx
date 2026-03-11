import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, LayoutGrid, CreditCard,
  Settings, HelpCircle, LogOut, Plus, ChevronLeft, ChevronRight, Shield, Workflow,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

const primaryNavItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { labelKey: 'nav.projects', icon: FolderOpen, path: '/app/projects' },
  { labelKey: 'nav.templates', icon: LayoutGrid, path: '/app/templates' },
  { labelKey: 'nav.billing', icon: CreditCard, path: '/app/billing' },
];

const bottomNavItems = [
  { labelKey: 'nav.settings', icon: Settings, path: '/app/settings' },
  { labelKey: 'nav.help', icon: HelpCircle, path: '/app/help' },
];

const RECENT_PROJECTS = [
  { name: 'Summer Campaign', color: '#ff713d' },
  { name: 'Brand Kit v2', color: '#7C3AED' },
  { name: 'Product Photoshoot', color: '#06B6D4' },
];

interface SidebarNavProps {
  onClose?: () => void;
}

const NavItem = ({
  icon: Icon, label, isActive, collapsed, onClick, color,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
  color?: string;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center rounded-[8px] transition-colors duration-150"
      style={{
        margin: '1px 0',
        padding: collapsed ? '10px 0' : '10px 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 12,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: color || (isActive ? '#ff713d' : '#5a5a60'),
        background: isActive
          ? 'rgba(255,113,61,0.08)'
          : hovered
          ? 'rgba(20,20,23,0.03)'
          : 'transparent',
      }}
    >
      <Icon style={{ width: 19, height: 19, flexShrink: 0, color: color || (isActive ? '#ff713d' : '#8e8e96') }} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
};

const SidebarNav = ({ onClose }: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useI18n();
  const devAdmin = import.meta.env.VITE_DEV_ADMIN === 'true';
  const [isSuperAdmin, setIsSuperAdmin] = useState(devAdmin);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (devAdmin) { setIsSuperAdmin(true); return; }
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data?.role === 'superadmin') setIsSuperAdmin(true); })
      .catch(() => {});
  }, [user, devAdmin]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{
        width: collapsed ? 68 : 244,
        borderRight: '1px solid rgba(20,20,23,0.06)',
        transition: 'width 260ms cubic-bezier(.4,0,.2,1)',
        overflow: 'visible',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle button — floats outside sidebar */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute z-50 flex items-center justify-center bg-white rounded-full"
        style={{
          width: 28,
          height: 28,
          right: -14,
          top: 72,
          border: '1px solid rgba(20,20,23,0.1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {collapsed
          ? <ChevronRight className="text-[#5a5a60]" style={{ width: 14, height: 14 }} />
          : <ChevronLeft className="text-[#5a5a60]" style={{ width: 14, height: 14 }} />
        }
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 overflow-hidden" style={{ padding: '16px 18px', height: 60 }}>
        <div
          className="shrink-0 flex items-center justify-center rounded-[7px] text-white"
          style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          C
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap overflow-hidden" style={{ fontSize: 17, fontWeight: 700, color: '#141417' }}>
            Creatyng
          </span>
        )}
      </div>

      {/* New Creation CTA */}
      <div style={{ margin: 14 }}>
        <button
          onClick={() => handleNav('/app/create')}
          className="w-full flex items-center justify-center gap-[8px] text-white rounded-[10px] transition-opacity hover:opacity-90"
          style={{
            padding: '10px 0',
            fontSize: 13.5,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
            boxShadow: '0 3px 10px rgba(255,113,61,0.3)',
          }}
        >
          <Plus style={{ width: 17, height: 17 }} />
          {!collapsed && <span>{t('nav.new_creation')}</span>}
        </button>
      </div>

      {/* Studio button (secondary) */}
      {!collapsed && (
        <div style={{ marginLeft: 14, marginRight: 14, marginBottom: 8 }}>
          <button
            onClick={() => handleNav('/app/create/studio')}
            className="w-full flex items-center justify-center gap-2 rounded-[10px] transition-colors hover:bg-[rgba(20,20,23,0.04)]"
            style={{
              padding: '7px 0',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#5a5a60',
              border: '1px solid rgba(20,20,23,0.08)',
            }}
          >
            <Workflow style={{ width: 15, height: 15 }} />
            <span>{t('nav.studio')}</span>
          </button>
        </div>
      )}
      {collapsed && (
        <div style={{ marginLeft: 14, marginRight: 14, marginBottom: 8 }}>
          <button
            onClick={() => handleNav('/app/create/studio')}
            title={t('nav.studio')}
            className="w-full flex items-center justify-center rounded-[10px] transition-colors hover:bg-[rgba(20,20,23,0.04)]"
            style={{
              padding: '8px 0',
              border: '1px solid rgba(20,20,23,0.08)',
            }}
          >
            <Workflow style={{ width: 17, height: 17, color: '#8e8e96' }} />
          </button>
        </div>
      )}

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        {primaryNavItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={t(item.labelKey)}
            isActive={location.pathname.startsWith(item.path)}
            collapsed={collapsed}
            onClick={() => handleNav(item.path)}
          />
        ))}

        {/* Recentes section (expanded only) */}
        {!collapsed && (
          <div className="mt-5 mb-2">
            <p
              className="px-[18px] mb-2 uppercase tracking-[0.1em]"
              style={{ fontSize: 10, fontWeight: 600, color: '#8e8e96' }}
            >
              Recentes
            </p>
            {RECENT_PROJECTS.map((p) => (
              <RecentItem key={p.name} name={p.name} color={p.color} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid rgba(20,20,23,0.06)' }}>
        <div className="px-2 py-2">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={t(item.labelKey)}
              isActive={location.pathname.startsWith(item.path)}
              collapsed={collapsed}
              onClick={() => handleNav(item.path)}
            />
          ))}

          {isSuperAdmin && (
            <div style={{ position: 'relative' }}>
              <NavItem
                icon={Shield}
                label="Super Admin"
                isActive={location.pathname.startsWith('/admin')}
                collapsed={collapsed}
                onClick={() => { navigate('/admin'); onClose?.(); }}
                color="#EF4444"
              />
              {/* Red badge dot */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: collapsed ? 8 : 14,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#EF4444',
                border: '1.5px solid #ffffff',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          <LogoutButton collapsed={collapsed} onLogout={() => { signOut(); navigate('/login'); }} label={t('nav.sign_out')} />
        </div>
      </div>
    </div>
  );
};

function RecentItem({ name, color }: { name: string; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className="w-full flex items-center gap-2 py-1.5 px-[18px] rounded-[6px] text-left"
      style={{ color: hovered ? '#141417' : '#5a5a60', fontSize: 13 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: color }} />
      <span className="truncate">{name}</span>
    </button>
  );
}

function LogoutButton({ collapsed, onLogout, label }: { collapsed: boolean; onLogout: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onLogout}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center rounded-[8px] transition-colors duration-150"
      style={{
        margin: '1px 0',
        padding: collapsed ? '10px 0' : '10px 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 12,
        fontSize: 13.5,
        color: '#EF4444',
        background: hovered ? 'rgba(239,68,68,0.05)' : 'transparent',
      }}
    >
      <LogOut style={{ width: 19, height: 19, flexShrink: 0, color: '#EF4444' }} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export default SidebarNav;
