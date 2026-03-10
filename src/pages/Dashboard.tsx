import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils, Sparkles, BookOpen, Zap, ChevronLeft, ChevronRight,
  FolderOpen, ArrowRight, Plus, Image,
} from 'lucide-react';
import { Button, Badge, EmptyState } from '@/components/creatyng';
import ProjectWizard from '@/components/ProjectWizard';
import { listProjects, createProject, deleteProject } from '@/features/projects/store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import type { Project } from '@/types/spec';

/* ── Feature cards ────────────────────────────────────── */
const FEATURES = [
  {
    id: 'food_pop',
    labelKey: 'dashboard.feature.food_pop',
    descKey: 'dashboard.feature.food_pop_desc',
    gradient: 'from-orange-500 to-rose-500',
    Icon: Utensils,
    badgeKey: 'dashboard.badge.popular',
    badgeVariant: 'accent' as const,
    active: true,
  },
  {
    id: 'pop_design',
    labelKey: 'dashboard.feature.pop_design',
    descKey: 'dashboard.feature.pop_design_desc',
    gradient: 'from-violet-600 to-indigo-500',
    Icon: Sparkles,
    badgeKey: 'dashboard.badge.new',
    badgeVariant: 'purple' as const,
    active: true,
  },
  {
    id: 'editorial',
    labelKey: 'dashboard.feature.editorial',
    descKey: 'dashboard.feature.editorial_desc',
    gradient: 'from-slate-600 to-gray-700',
    Icon: BookOpen,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default' as const,
    active: false,
  },
  {
    id: 'neon',
    labelKey: 'dashboard.feature.neon',
    descKey: 'dashboard.feature.neon_desc',
    gradient: 'from-fuchsia-600 to-cyan-500',
    Icon: Zap,
    badgeKey: 'dashboard.badge.coming',
    badgeVariant: 'default' as const,
    active: false,
  },
];

/* ── Discover mosaic data ─────────────────────────────── */
const DISCOVER = [
  { gradient: 'from-orange-400 to-rose-500', h: 'h-44' },
  { gradient: 'from-violet-500 to-purple-600', h: 'h-56' },
  { gradient: 'from-cyan-500 to-teal-500', h: 'h-36' },
  { gradient: 'from-amber-400 to-orange-500', h: 'h-48' },
  { gradient: 'from-pink-500 to-rose-400', h: 'h-40' },
  { gradient: 'from-blue-500 to-indigo-500', h: 'h-52' },
  { gradient: 'from-emerald-500 to-green-400', h: 'h-44' },
  { gradient: 'from-fuchsia-500 to-pink-500', h: 'h-36' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const PROJECT_GRADIENTS = [
  'from-orange-400 to-rose-500', 'from-violet-500 to-purple-600',
  'from-cyan-500 to-teal-500', 'from-amber-400 to-orange-500',
  'from-blue-500 to-indigo-500', 'from-emerald-500 to-green-400',
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [discoverTab, setDiscoverTab] = useState<'explore' | 'templates'>('explore');

  const featureScrollRef = useRef<HTMLDivElement>(null);
  const projectScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setProjects(listProjects()); }, [wizardOpen]);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    t('dashboard.fallback_name');

  const scrollBy = (ref: React.RefObject<HTMLDivElement | null>, dir: number) => {
    ref.current?.scrollBy({ left: dir * 210, behavior: 'smooth' });
  };

  return (
    <div className="min-h-full px-6 py-7 max-w-6xl mx-auto space-y-10">

      {/* ── 1. Greeting ─────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-semibold text-foreground">
          {t('dashboard.greeting', { name: firstName })}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.greeting_sub')}</p>
      </div>

      {/* ── 2. Feature carousel ─────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t('dashboard.quick_create')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/templates')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.view_all')}
            </button>
            <div className="flex gap-1">
              {[{ dir: -1, Icon: ChevronLeft }, { dir: 1, Icon: ChevronRight }].map(({ dir, Icon }) => (
                <button
                  key={dir}
                  onClick={() => scrollBy(featureScrollRef, dir)}
                  className="h-7 w-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={featureScrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className="relative shrink-0 w-[195px] h-[155px] rounded-2xl overflow-hidden group"
              style={{ opacity: f.active ? 1 : 0.5, cursor: f.active ? 'pointer' : 'default' }}
              onMouseEnter={() => f.active && setHoveredFeature(f.id)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={() => f.active && navigate('/app/create')}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient}`} />
              <div className="relative z-10 p-4 h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <f.Icon className="w-4 h-4 text-white" />
                  </div>
                  <Badge variant={f.badgeVariant} className="text-[10px]">
                    {t(f.badgeKey)}
                  </Badge>
                </div>
                <div className="mt-auto">
                  <p className="text-white font-semibold text-sm line-clamp-2">{t(f.labelKey)}</p>
                </div>
              </div>
              {hoveredFeature === f.id && (
                <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 animate-fade-in">
                  <button className="bg-white text-[#141417] text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors">
                    {t('dashboard.create_now')}
                  </button>
                  <p className="text-white/80 text-[11px] text-center px-4 line-clamp-2">
                    {t(f.descKey)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. My Projects row ───────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t('dashboard.recent_projects')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/projects')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('common.view_all')} <ArrowRight className="h-3 w-3" />
            </button>
            <div className="flex gap-1">
              {[{ dir: -1, Icon: ChevronLeft }, { dir: 1, Icon: ChevronRight }].map(({ dir, Icon }) => (
                <button
                  key={dir}
                  onClick={() => scrollBy(projectScrollRef, dir)}
                  className="h-7 w-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl">
            <EmptyState
              icon={<FolderOpen className="w-6 h-6" />}
              title={t('projects.empty_title')}
              description={t('dashboard.empty_description')}
              ctaLabel={t('projects.new_project')}
              onCta={() => setWizardOpen(true)}
            />
          </div>
        ) : (
          <div ref={projectScrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setWizardOpen(true)}
              className="shrink-0 w-[175px] h-[135px] rounded-2xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{t('projects.new_project')}</span>
            </button>

            {projects.slice(0, 8).map((p, idx) => (
              <div
                key={p.id}
                className="group shrink-0 w-[175px] h-[135px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                onClick={() => navigate(`/app/projects/${p.id}`)}
              >
                <div className={`h-[84px] bg-gradient-to-br ${PROJECT_GRADIENTS[idx % PROJECT_GRADIENTS.length]} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="px-2.5 pt-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(p.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Discover gallery ─────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t('dashboard.discover')}</h2>
          <div className="flex p-0.5 bg-muted rounded-lg">
            {(['explore', 'templates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDiscoverTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                  discoverTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`dashboard.discover_tab_${tab}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {DISCOVER.map((item, i) => (
            <div
              key={i}
              className={`break-inside-avoid rounded-2xl bg-gradient-to-br ${item.gradient} ${item.h} relative overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/60 transition-all`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                <span className="text-[11px] text-white font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  {t('dashboard.create_similar')}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-5">
          <Button variant="outline" size="md" onClick={() => navigate('/app/templates')}>
            {t('dashboard.view_more')}
          </Button>
        </div>
      </section>

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
};

export default Dashboard;
