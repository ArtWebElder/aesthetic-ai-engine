import { useState } from 'react';
import {
  User, Settings2, Palette, Key,
  Camera, Upload, Plus, X, Copy, Trash2, Bell, Moon, Sun,
} from 'lucide-react';
import { Button, Toggle } from '@/components/creatyng';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { LocaleDropdown } from '@/components/LocaleDropdown';
import ThemeToggle from '@/components/ThemeToggle';

type SettingsTab = 'profile' | 'preferences' | 'brandkit' | 'apikeys';

const TABS: { id: SettingsTab; labelKey: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile', labelKey: 'settings.tab.profile', Icon: User },
  { id: 'preferences', labelKey: 'settings.tab.preferences', Icon: Settings2 },
  { id: 'brandkit', labelKey: 'settings.tab.brandkit', Icon: Palette },
  { id: 'apikeys', labelKey: 'settings.tab.apikeys', Icon: Key },
];

/* ── Mock API keys ─────────────────────────────────────── */
const MOCK_KEYS = [
  { id: 'k1', name: 'Production Key', key: 'crtyng_live_••••••••••••3f8a', date: '2026-03-01' },
  { id: 'k2', name: 'Dev Key', key: 'crtyng_live_••••••••••••7c2d', date: '2026-02-15' },
];

/* ── Mock brand colors ─────────────────────────────────── */
const DEFAULT_COLORS = ['#ff713d', '#141417', '#ffffff', '#7C3AED'];

const Settings = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [brandColors, setBrandColors] = useState(DEFAULT_COLORS);
  const [brandFonts, setBrandFonts] = useState(['Instrument Sans', 'Space Grotesk']);
  const [fontInput, setFontInput] = useState('');
  const [apiKeys, setApiKeys] = useState(MOCK_KEYS);

  const addFont = () => {
    if (fontInput.trim() && !brandFonts.includes(fontInput.trim())) {
      setBrandFonts((f) => [...f, fontInput.trim()]);
      setFontInput('');
    }
  };

  const removeFont = (f: string) => setBrandFonts((prev) => prev.filter((x) => x !== f));
  const deleteKey = (id: string) => setApiKeys((prev) => prev.filter((k) => k.id !== id));

  return (
    <div className="min-h-full px-6 py-7 max-w-5xl mx-auto">
      <div className="animate-fade-up mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
      </div>

      <div className="flex gap-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {/* ── Left sub-sidebar ─────────────────────── */}
        <aside className="hidden sm:flex flex-col gap-1 w-52 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                activeTab === tab.id
                  ? 'bg-creatyng-accent-pale text-creatyng-accent'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.Icon className="w-4 h-4 shrink-0" />
              {t(tab.labelKey)}
            </button>
          ))}
        </aside>

        {/* Mobile tab pills */}
        <div className="sm:hidden flex gap-1.5 overflow-x-auto scrollbar-none pb-1 absolute">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-creatyng-accent-pale text-creatyng-accent' : 'bg-muted text-muted-foreground'}`}>
              <tab.Icon className="w-3.5 h-3.5" />{t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* ── Right content ────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ── Profile tab ─────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                    {name.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{name || t('settings.no_name')}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t('settings.name')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t('settings.email')}</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full h-9 px-3 text-sm bg-muted border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t('settings.phone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <Button variant="primary" size="sm">{t('common.save')}</Button>

              {/* Danger zone */}
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.danger_zone')}</p>
                <Button variant="danger" size="sm">
                  {t('settings.delete_account')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Preferences tab ─────────────────────── */}
          {activeTab === 'preferences' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              {/* Language */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('settings.pref.language')}</h3>
                <LocaleDropdown />
              </div>

              <div className="h-px bg-border" />

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('settings.theme')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.theme_hint')}</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="h-px bg-border" />

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{t('settings.pref.notifications')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{t('settings.pref.email_notif')}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.pref.email_notif_desc')}</p>
                    </div>
                    <Toggle checked={emailNotif} onChange={setEmailNotif} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{t('settings.pref.push_notif')}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.pref.push_notif_desc')}</p>
                    </div>
                    <Toggle checked={pushNotif} onChange={setPushNotif} />
                  </div>
                </div>
              </div>

              <Button variant="primary" size="sm">{t('settings.save_preferences')}</Button>
            </div>
          )}

          {/* ── Brand Kit tab ────────────────────────── */}
          {activeTab === 'brandkit' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              {/* Logo upload */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('settings.brand.logo')}</h3>
                <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-2.5 hover:border-primary/40 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('settings.brand.logo_hint')}</p>
                  <p className="text-xs text-muted-foreground/60">PNG, SVG · max 5 MB</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Color palette */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('settings.brand.colors')}</h3>
                <div className="flex gap-3 flex-wrap">
                  {brandColors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-border cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => setBrandColors((c) => [...c, '#000000'])}
                      className="w-10 h-10 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-muted-foreground">Add</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Fonts */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('settings.brand.fonts')}</h3>
                <div className="flex flex-wrap gap-2">
                  {brandFonts.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-foreground">
                      {f}
                      <button onClick={() => removeFont(f)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fontInput}
                    onChange={(e) => setFontInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFont()}
                    placeholder={t('settings.brand.add_font_placeholder')}
                    className="flex-1 h-9 px-3 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button variant="outline" size="sm" onClick={addFont}>
                    {t('settings.brand.add_font')}
                  </Button>
                </div>
              </div>

              <Button variant="primary" size="sm">{t('settings.save_brand_kit')}</Button>
            </div>
          )}

          {/* ── API Keys tab ─────────────────────────── */}
          {activeTab === 'apikeys' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('settings.apikeys.title')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.apikeys.subtitle')}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('settings.apikeys.new')}
                </Button>
              </div>

              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{k.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{k.key}</p>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">{k.date}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => navigator.clipboard.writeText(k.key)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteKey(k.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-creatyng-error hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {apiKeys.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">{t('settings.apikeys.empty')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
