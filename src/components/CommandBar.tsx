import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImagePlus,
  ShoppingBag,
  Camera,
  FolderOpen,
  CreditCard,
  Settings,
  Command,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useI18n } from '@/i18n';

const actions = [
  { labelKey: 'command.new_social_ad', icon: ImagePlus, route: '/app/projects', shortcut: 'S' },
  { labelKey: 'command.new_ecom_banner', icon: ShoppingBag, route: '/app/projects', shortcut: 'E' },
  { labelKey: 'command.new_photoshoot', icon: Camera, route: '/app/projects', shortcut: 'P' },
  { labelKey: 'nav.projects', icon: FolderOpen, route: '/app/projects', shortcut: 'J' },
  { labelKey: 'nav.billing', icon: CreditCard, route: '/app/billing', shortcut: 'B' },
  { labelKey: 'nav.settings', icon: Settings, route: '/app/settings', shortcut: ',' },
];

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
      <CommandInput placeholder={t("command.search_actions")} />
      <CommandList>
        <CommandEmpty>{t("command.no_results")}</CommandEmpty>
        <CommandGroup heading={t("command.quick_actions")}>
          {actions.map((action) => (
            <CommandItem
              key={action.labelKey}
              onSelect={() => handleSelect(action.route)}
              className="cursor-pointer"
            >
              <action.icon className="mr-3 h-4 w-4 text-foreground/70" />
              <span className="flex-1">{t(action.labelKey)}</span>
              <kbd className="ml-auto text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm font-mono">
                {action.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandBar;
