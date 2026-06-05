import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  CreditCard,
  Settings,
  LayoutDashboard,
  LayoutGrid,
  HelpCircle,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useI18n } from '@/i18n';

const createActions = [
  { labelKey: 'nav.new_creation', icon: Plus, route: '/app/create', shortcut: 'N' },
];

const navActions = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, route: '/app/dashboard', shortcut: 'D' },
  { labelKey: 'nav.projects', icon: FolderOpen, route: '/app/projects', shortcut: 'J' },
  { labelKey: 'nav.templates', icon: LayoutGrid, route: '/app/templates', shortcut: 'T' },
  { labelKey: 'nav.billing', icon: CreditCard, route: '/app/billing', shortcut: 'B' },
  { labelKey: 'nav.settings', icon: Settings, route: '/app/settings', shortcut: ',' },
  { labelKey: 'nav.help', icon: HelpCircle, route: '/app/help', shortcut: '?' },
];

const ShortcutBadge = ({ char }: { char: string }) => (
  <kbd
    style={{
      marginLeft: 'auto',
      fontSize: 10,
      padding: '2px 6px',
      borderRadius: 5,
      fontFamily: 'monospace',
      fontWeight: 600,
      background: 'rgba(255,113,61,0.10)',
      color: '#ff713d',
      border: '1px solid rgba(255,113,61,0.18)',
    }}
  >
    {char}
  </kbd>
);

const CommandBar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('command.search_actions')} />
      <CommandList>
        <CommandEmpty>{t('command.no_results')}</CommandEmpty>

        <CommandGroup heading={t('command.group_create')}>
          {createActions.map((action) => (
            <CommandItem
              key={action.labelKey}
              onSelect={() => handleSelect(action.route)}
              className="cursor-pointer"
            >
              <action.icon className="mr-3 h-4 w-4" style={{ color: '#ff713d' }} />
              <span className="flex-1">
                {t(action.labelKey)}
              </span>
              <ShortcutBadge char={action.shortcut} />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('command.group_navigate')}>
          {navActions.map((action) => (
            <CommandItem
              key={action.labelKey}
              onSelect={() => handleSelect(action.route)}
              className="cursor-pointer"
            >
              <action.icon className="mr-3 h-4 w-4 text-[#8e8e96]" />
              <span className="flex-1">
                {t(action.labelKey)}
              </span>
              <ShortcutBadge char={action.shortcut} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandBar;
