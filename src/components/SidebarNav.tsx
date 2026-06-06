import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, CreditCard,
  Settings, HelpCircle, LogOut, Plus, ChevronLeft, ChevronRight, Shield, Workflow, X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

const primaryNavItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { labelKey: 'nav.projects', icon: FolderOpen, path: '/app/projects' },
  { labelKey: 'nav.billing', icon: CreditCard, path: '/app/billing' },
];

const bottomNavItems = [
  { labelKey: 'nav.settings', icon: Settings, path: '/app/settings' },
  { labelKey: 'nav.help', icon: HelpCircle, path: '/app/help' },
];

const RECENT_PROJECTS = [
  { name: 'Summer Campaign', color: 'hsl(var(--brand))' },
  { name: 'Brand Kit v2', color: '#7C3AED' },
  { name: 'Product Photoshoot', color: '#06B6D4' },
];

interface SidebarNavProps {
  onClose?: () => void;
  forceExpanded?: boolean;
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
        color: color || (isActive ? 'hsl(var(--brand))' : 'hsl(var(--sidebar-foreground))'),
        background: isActive
          ? 'hsl(var(--sidebar-primary) / 0.08)'
          : hovered
          ? 'hsl(var(--foreground) / 0.04)'
          : 'transparent',
      }}
    >
      <Icon style={{ width: 19, height: 19, flexShrink: 0, color: color || (isActive ? 'hsl(var(--brand))' : 'hsl(var(--sidebar-foreground))') }} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
};

const SidebarNav = ({ onClose, forceExpanded }: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useI18n();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isMobileDrawer = Boolean(forceExpanded);
  const isCollapsed = isMobileDrawer ? false : collapsed;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { setIsSuperAdmin(data?.role === 'superadmin'); })
      .catch(() => { setIsSuperAdmin(false); });
  }, [user]);

  const handleNav = (path: string) => {
    if (path === '/app/create' && location.pathname === '/app/create') {
      // Already on wizard — navigate with fresh flag to trigger reset confirmation
      navigate('/app/create', { state: { fresh: true, ts: Date.now() }, replace: true });
    } else {
      navigate(path);
    }
    onClose?.();
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: isMobileDrawer ? '100%' : (isCollapsed ? 68 : 244),
        background: 'hsl(var(--sidebar-background))',
        borderRight: isMobileDrawer ? 'none' : '1px solid hsl(var(--sidebar-border))',
        transition: 'width 260ms cubic-bezier(.4,0,.2,1)',
        overflow: 'visible',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle button — floats outside sidebar (hidden on mobile drawer) */}
      {!isMobileDrawer && (
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute z-50 flex items-center justify-center rounded-full"
          style={{
            width: 28,
            height: 28,
            right: -14,
            top: 72,
            border: '1px solid hsl(var(--sidebar-border))',
            background: 'hsl(var(--sidebar-background))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {isCollapsed
            ? <ChevronRight style={{ width: 14, height: 14, color: 'hsl(var(--sidebar-foreground))' }} />
            : <ChevronLeft style={{ width: 14, height: 14, color: 'hsl(var(--sidebar-foreground))' }} />
          }
        </button>
      )}

      {/* Logo + close button */}
      <div className="flex items-center gap-2.5 overflow-hidden" style={{ padding: '16px 18px', height: 60 }}>
        {isCollapsed
          ? <Logo iconOnly height={28} />
          : <Logo height={24} />
        }
        {isMobileDrawer && (
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center rounded-md hover:bg-foreground/5 transition-colors"
            style={{ width: 32, height: 32 }}
          >
            <X style={{ width: 18, height: 18, color: 'hsl(var(--sidebar-foreground))' }} />
          </button>
        )}
      </div>

      {/* New Creation CTA */}
      <div style={{ margin: 14 }}>
        <Button
          variant="gradient"
          onClick={() => handleNav('/app/create')}
          className="w-full"
          style={{ padding: '10px 0', fontSize: 13.5, height: 'auto' }}
        >
          <Plus style={{ width: 17, height: 17 }} />
          {!isCollapsed && <span>{t('nav.new_creation')}</span>}
        </Button>
      </div>

      {/* Studio button (secondary) */}
      {!isCollapsed && (
        <div style={{ marginLeft: 14, marginRight: 14, marginBottom: 8 }}>
          <button
            onClick={() => handleNav('/app/create/studio')}
            className="w-full flex items-center justify-center gap-2 rounded-[10px] transition-colors"
            style={{
              padding: '7px 0',
              fontSize: 13.5,
              fontWeight: 500,
              color: 'hsl(var(--sidebar-foreground))',
              border: '1px solid hsl(var(--sidebar-border))',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <Workflow style={{ width: 15, height: 15 }} />
            <span>{t('nav.studio')}</span>
          </button>
        </div>
      )}
      {isCollapsed && (
        <div style={{ marginLeft: 14, marginRight: 14, marginBottom: 8 }}>
          <button
            onClick={() => handleNav('/app/create/studio')}
            title={t('nav.studio')}
            className="w-full flex items-center justify-center rounded-[10px] transition-colors"
            style={{
              padding: '8px 0',
              border: '1px solid hsl(var(--sidebar-border))',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <Workflow style={{ width: 17, height: 17, color: 'hsl(var(--sidebar-foreground))' }} />
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
            collapsed={isCollapsed}
            onClick={() => handleNav(item.path)}
          />
        ))}

        {/* Recentes section (expanded only) */}
        {!isCollapsed && (
          <div className="mt-5 mb-2">
            <p
              className="px-[18px] mb-2 uppercase tracking-[0.1em]"
              style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--sidebar-foreground))' }}
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
      <div style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="px-2 py-2">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={t(item.labelKey)}
              isActive={location.pathname.startsWith(item.path)}
              collapsed={isCollapsed}
              onClick={() => handleNav(item.path)}
            />
          ))}

          {isSuperAdmin && (
            <div style={{ position: 'relative' }}>
              <NavItem
                icon={Shield}
                label="Super Admin"
                isActive={location.pathname.startsWith('/admin')}
                collapsed={isCollapsed}
                onClick={() => { navigate('/admin'); onClose?.(); }}
                color="#EF4444"
              />
              {/* Red badge dot */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: isCollapsed ? 8 : 14,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#EF4444',
                border: '1.5px solid hsl(var(--sidebar-background))',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          <LogoutButton collapsed={isCollapsed} onLogout={() => { signOut(); navigate('/login'); }} label={t('nav.sign_out')} />
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
      style={{ color: 'hsl(var(--sidebar-foreground))', fontSize: 13, opacity: hovered ? 1 : 0.7 }}
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
