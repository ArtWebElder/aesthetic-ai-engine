import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { useTheme } from 'next-themes';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';

const navItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { labelKey: 'nav.projects', icon: FolderOpen, path: '/app/projects' },
  { labelKey: 'nav.billing', icon: CreditCard, path: '/app/billing' },
  { labelKey: 'nav.settings', icon: Settings, path: '/app/settings' },
  { labelKey: 'nav.help', icon: HelpCircle, path: '/app/help' },
];

interface SidebarNavProps {
  onClose?: () => void;
}

const SidebarNav = ({ onClose }: SidebarNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full w-60 bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="p-4 flex items-center gap-2.5">
        <img src={logo} alt="Creatyng" className="h-7 w-auto" />
      </div>

      <div className="mx-4 h-px bg-border" />

      {/* New creation CTA */}
      <div className="px-3 pt-3">
        <button
          onClick={() => handleNav('/app/create')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
        >
          <Sparkles className="h-4 w-4" />
          {t('nav.new_creation')}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("nav.sign_out")}
        </Button>
      </div>
    </div>
  );
};

export default SidebarNav;
