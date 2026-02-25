import { Search, Coins, Command, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from '@/components/ThemeToggle';
import { mockCredits } from '@/lib/mocks/data';
import { useAuth } from '@/features/auth/fake-auth';
import { useI18n } from '@/i18n';
import { LocaleDropdown } from '@/components/LocaleDropdown';

interface TopbarProps {
  onMenuToggle?: () => void;
}

const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {onMenuToggle && (
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onMenuToggle}>
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Search placeholder */}
      <button
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md px-3 py-1.5 hover:bg-accent transition-colors duration-150"
        onClick={() => {
          const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
          document.dispatchEvent(e);
        }}
      >
        <Search className="h-3.5 w-3.5" />
        <span>{t("topbar.search")}</span>
        <kbd className="ml-4 text-xs bg-background/60 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="flex-1" />

      <LocaleDropdown compact />

      {/* Credits */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Coins className="h-3.5 w-3.5" />
        <span className="font-medium">{mockCredits.current}</span>
      </div>

      <ThemeToggle />

      {/* Avatar */}
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
          {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    </header>
  );
};

export default Topbar;
