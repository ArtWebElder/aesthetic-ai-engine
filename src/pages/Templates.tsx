import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Utensils, Sparkles, BookOpen, Zap, Video, Copy, LayoutGrid, Tv, Coins } from 'lucide-react';
import { Badge, EmptyState } from '@/components/creatyng';
import { useI18n } from '@/i18n';

/* ── Template data ───────────────────────────────────── */
type TemplateCategory = 'all' | 'food' | 'design' | 'video' | 'utilities';

interface TemplateItem {
  id: string;
  nameKey: string;
  descKey: string;
  category: Exclude<TemplateCategory, 'all'>;
  gradient: string;
  Icon: React.FC<{ className?: string }>;
  credits: number;
  badgeKey?: string;
  badgeVariant?: 'accent' | 'purple' | 'default';
  active: boolean;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'food_pop',
    nameKey: 'templates.food_pop.name',
    descKey: 'templates.food_pop.desc',
    category: 'food',
    gradient: 'from-orange-500 to-rose-500',
    Icon: Utensils,
    credits: 5,
    badgeKey: 'dashboard.badge.popular',
    badgeVariant: 'accent',
    active: true,
  },
  {
    id: 'pop_design',
    nameKey: 'templates.pop_design.name',
    descKey: 'templates.pop_design.desc',
    category: 'design',
    gradient: 'from-violet-600 to-indigo-500',
    Icon: Sparkles,
    credits: 8,
    badgeKey: 'dashboard.badge.new',
    badgeVariant: 'purple',
    active: true,
  },
  {
    id: 'editorial',
    nameKey: 'templates.editorial.name',
    descKey: 'templates.editorial.desc',
    category: 'design',
    gradient: 'from-slate-600 to-gray-700',
    Icon: BookOpen,
    credits: 6,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'neon_glow',
    nameKey: 'templates.neon_glow.name',
    descKey: 'templates.neon_glow.desc',
    category: 'design',
    gradient: 'from-fuchsia-600 to-cyan-500',
    Icon: Zap,
    credits: 7,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'ugc_video',
    nameKey: 'templates.ugc_video.name',
    descKey: 'templates.ugc_video.desc',
    category: 'video',
    gradient: 'from-red-500 to-pink-500',
    Icon: Video,
    credits: 12,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'ad_clone',
    nameKey: 'templates.ad_clone.name',
    descKey: 'templates.ad_clone.desc',
    category: 'design',
    gradient: 'from-blue-500 to-indigo-600',
    Icon: Copy,
    credits: 10,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'multi_format',
    nameKey: 'templates.multi_format.name',
    descKey: 'templates.multi_format.desc',
    category: 'utilities',
    gradient: 'from-emerald-500 to-teal-500',
    Icon: LayoutGrid,
    credits: 2,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'reels_static',
    nameKey: 'templates.reels_static.name',
    descKey: 'templates.reels_static.desc',
    category: 'video',
    gradient: 'from-amber-500 to-orange-500',
    Icon: Tv,
    credits: 10,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
  {
    id: 'screen_mockup',
    nameKey: 'templates.screen_mockup.name',
    descKey: 'templates.screen_mockup.desc',
    category: 'utilities',
    gradient: 'from-slate-500 to-slate-700',
    Icon: Tv,
    credits: 6,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default',
    active: false,
  },
];

const CATEGORIES: { id: TemplateCategory; labelKey: string }[] = [
  { id: 'all', labelKey: 'templates.filter.all' },
  { id: 'food', labelKey: 'templates.filter.food' },
  { id: 'design', labelKey: 'templates.filter.design' },
  { id: 'video', labelKey: 'templates.filter.video' },
  { id: 'utilities', labelKey: 'templates.filter.utilities' },
];

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [category, setCategory] = useState<TemplateCategory>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return TEMPLATES.filter((tmpl) => {
      if (category !== 'all' && tmpl.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = t(tmpl.nameKey).toLowerCase();
        const desc = t(tmpl.descKey).toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [category, search, t]);

  return (
    <div className="min-h-full">
      {/* ── Hero banner ──────────────────────────────── */}
      <div
        className="px-6 py-10 border-b border-border"
        style={{
          background: 'radial-gradient(ellipse 60% 120% at 50% -10%, rgba(255,113,61,0.12) 0%, transparent 70%)',
        }}
      >
        <div className="max-w-6xl mx-auto animate-fade-up">
          <h1 className="text-2xl font-semibold text-foreground">{t('templates.hero.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('templates.hero.subtitle')}</p>
        </div>
      </div>

      {/* ── Filter bar (sticky) ──────────────────────── */}
      <div className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                  category === cat.id
                    ? 'bg-creatyng-accent-pale border-creatyng-accent text-creatyng-accent'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative shrink-0 w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('templates.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Template grid ────────────────────────────── */}
      <div className="px-6 py-7 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title={t('templates.empty.title')}
            description={t('templates.empty.desc')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tmpl, i) => (
              <div
                key={tmpl.id}
                className={`group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 animate-scale-in ${
                  tmpl.active
                    ? 'cursor-pointer hover:border-primary/50 hover:shadow-[0_8px_24px_rgba(255,113,61,0.10)]'
                    : 'opacity-60 cursor-default'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => tmpl.active && navigate('/app/create')}
              >
                {/* Card top gradient */}
                <div className={`h-40 bg-gradient-to-br ${tmpl.gradient} relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute inset-0 p-4 flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <tmpl.Icon className="w-4 h-4 text-white" />
                    </div>
                    {tmpl.badgeKey && (
                      <Badge variant={tmpl.badgeVariant ?? 'default'} className="text-[10px]">
                        {t(tmpl.badgeKey)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t(tmpl.nameKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t(tmpl.descKey)}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Coins className="h-3 w-3" />
                      <span>{t('templates.credits', { n: String(tmpl.credits) })}</span>
                    </div>
                    {tmpl.active ? (
                      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('templates.use')} →
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">{t('dashboard.badge.coming')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
