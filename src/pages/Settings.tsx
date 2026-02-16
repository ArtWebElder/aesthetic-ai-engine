import { User, Globe, Download, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ThemeToggle from '@/components/ThemeToggle';
import AuroraDivider from '@/components/AuroraDivider';
import { useAuth } from '@/features/auth/fake-auth';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences.</p>
      </div>

      {/* Profile */}
      <section className="glass-surface rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">Profile</h2>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input defaultValue={user?.name || ''} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Email</Label>
          <Input defaultValue={user?.email || ''} disabled />
        </div>
        <Button variant="outline" size="sm" disabled>Save</Button>
      </section>

      <AuroraDivider />

      {/* Language */}
      <section className="glass-surface rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">Language</h2>
        </div>
        <Select defaultValue="en">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Export */}
      <section className="glass-surface rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">Export Preferences</h2>
        </div>
        <Select defaultValue="png">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="jpg">JPG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Theme */}
      <section className="glass-surface rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-heading font-semibold">Theme</h2>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Switch between System, Dark, and Light.</p>
      </section>
    </div>
  );
};

export default Settings;
