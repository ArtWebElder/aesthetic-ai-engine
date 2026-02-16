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

const actions = [
  { label: 'New Social Ad', icon: ImagePlus, route: '/app/projects', shortcut: 'S' },
  { label: 'New E-com Banner', icon: ShoppingBag, route: '/app/projects', shortcut: 'E' },
  { label: 'New Photoshoot', icon: Camera, route: '/app/projects', shortcut: 'P' },
  { label: 'Projects', icon: FolderOpen, route: '/app/projects', shortcut: 'J' },
  { label: 'Billing', icon: CreditCard, route: '/app/billing', shortcut: 'B' },
  { label: 'Settings', icon: Settings, route: '/app/settings', shortcut: ',' },
];

const CommandBar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
      <CommandInput placeholder="Search actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {actions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => handleSelect(action.route)}
              className="cursor-pointer"
            >
              <action.icon className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{action.label}</span>
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
