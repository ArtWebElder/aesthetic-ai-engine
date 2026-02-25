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
import { useAuth } from '@/features/auth/fake-auth';
import { useI18n } from '@/i18n';
import { LocaleDropdown } from '@/components/LocaleDropdown';

const Settings = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <section className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">{t('settings.profile')}</h2>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t('settings.name')}</Label>
          <Input defaultValue={user?.name || ''} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t('settings.email')}</Label>
          <Input defaultValue={user?.email || ''} disabled />
        </div>
        <Button variant="outline" size="sm" disabled>{t('common.save')}</Button>
      </section>

      <div className="h-px bg-border/50" />

      <section className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">{t('language')}</h2>
        </div>
        <LocaleDropdown />
      </section>

      <section className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-heading font-semibold">{t('settings.export_preferences')}</h2>
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

      <section className="bg-card border border-border/50 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-heading font-semibold">{t('settings.theme')}</h2>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t('settings.theme_hint')}</p>
      </section>
    </div>
  );
};

export default Settings;
