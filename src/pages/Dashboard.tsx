import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, Sparkles, ChevronLeft, ChevronRight,
  FolderOpen, Plus, Image,
  Scissors, SlidersHorizontal, MonitorPlay, Quote, UserRound, Package, Palette, LayoutTemplate, Maximize2, LayoutGrid, Expand,
} from 'lucide-react';
import { EmptyState } from '@/components/creatyng';
import { listProjects } from '@/features/projects/store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import type { Project } from '@/types/spec';
import { useEffect } from 'react';
import { PRESET_FLOWS, type PresetFlow } from '@/app/create/studio/types';
import { FLOW_STYLES } from '@/app/create/studio/flowStyles';

// Lucide icon names used by PRESET_FLOWS → components
const FLOW_ICONS: Record<string, React.ElementType> = {
  Scissors, SlidersHorizontal, MonitorPlay, Quote, UserRound, Package, Copy, Palette, LayoutTemplate, Sparkles, Maximize2, LayoutGrid, Expand,
};

// Flows grouped into categories → each renders as a horizontal carousel on the dashboard.
const FLOW_CATEGORIES: { key: string; labelKey: string; ids: string[] }[] = [
  { key: 'free',     labelKey: 'dashboard.cat.free',     ids: ['remove-bg', 'recolor', 'upscale', 'multi-format'] },
  { key: 'social',   labelKey: 'dashboard.cat.social',   ids: ['thumbnail', 'quote-card', 'headshot', 'reframe-ai'] },
  { key: 'ecom',     labelKey: 'dashboard.cat.ecom',     ids: ['product-scene', 'creative-banner'] },
  { key: 'advanced', labelKey: 'dashboard.cat.advanced', ids: ['clone-criativo', 'styled-photo', 'simple-gen'] },
];

/* ── Discover mosaic data ─────────────────────────────── */
const DISCOVER = [
  { gradient: 'linear-gradient(135deg, hsl(var(--brand)), #e11d48)', h: 176 },
  { gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', h: 224 },
  { gradient: 'linear-gradient(135deg, #0891b2, #0d9488)', h: 144 },
  { gradient: 'linear-gradient(135deg, #d97706, #ea580c)', h: 192 },
  { gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', h: 160 },
  { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', h: 208 },
  { gradient: 'linear-gradient(135deg, #10b981, #22c55e)', h: 176 },
  { gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', h: 144 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const PROJECT_GRADIENTS = [
  'linear-gradient(135deg, hsl(var(--brand)), #e11d48)',
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #0891b2, #0d9488)',
  'linear-gradient(135deg, #d97706, #ea580c)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #10b981, #22c55e)',
];

/* ── Section header ──────────────────────────────────── */
function SectionHeader({
  title, onViewAll, scrollRef,
}: {
  title: string;
  onViewAll?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useI18n();
  const scrollBy = (dir: number) => scrollRef?.current?.scrollBy({ left: dir * 210, behavior: 'smooth' });

  return (
    <div className="flex items-center justify-between mb-3">
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{title}</h2>
      <div className="flex items-center gap-2">
        {scrollRef && (
          <div className="flex gap-1">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scrollBy(dir)}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                {dir === -1 ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="transition-colors"
            style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
          >
            {t('common.view_all')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Flow card (real Studio flows) — Spotlight cover-card ─ */
function FlowCard({ flow, label, desc, chip, onClick }: {
  flow: PresetFlow;
  label: string;
  desc: string;
  chip: string;
  onClick: () => void;
}) {
  const Icon = FLOW_ICONS[flow.icon] || Sparkles;
  return (
    <div className="cydf shrink-0 snap-start w-[86vw] max-w-[340px] sm:w-[230px]" onClick={onClick}>
      {/* Capa (hue gradient) + glass tile + cost pill */}
      <div className="cydf-cap" style={{ background: `linear-gradient(140deg, ${flow.color}, rgba(20,20,23,0.55))` }}>
        <div className="cydf-overlay" />
        <div className="cydf-tile">
          <Icon style={{ width: 18, height: 18, color: '#ffffff' }} />
        </div>
        <span className="cydf-cost">{chip}</span>
      </div>
      {/* Body on card surface */}
      <div className="cydf-body">
        <p className="cydf-title line-clamp-1">{label}</p>
        <p className="cydf-desc line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

/* ── Project card ────────────────────────────────────── */
function ProjectCard({
  project, gradient, onClick,
}: {
  project: Project;
  gradient: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group shrink-0 overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        width: 180,
        borderRadius: 10,
        border: hovered ? '1.5px solid hsl(var(--brand))' : '1px solid hsl(var(--border))',
        background: hovered ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
        boxShadow: hovered ? '0 4px 16px hsl(var(--brand) / 0.12)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="relative" style={{ height: 100, background: gradient }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Image className="w-8 h-8 text-white" />
        </div>
        <div
          className="absolute top-2 left-2 rounded-full"
          style={{ width: 8, height: 8, background: 'hsl(var(--brand))' }}
        />
      </div>
      <div style={{ padding: '10px 12px' }}>
        <p className="line-clamp-1" style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          {project.name}
        </p>
        <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
          {formatDate(project.updatedAt)}
        </p>
      </div>
    </div>
  );
}

/* ── Discover item ───────────────────────────────────── */
function DiscoverItem({ gradient, height }: { gradient: string; height: number }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="break-inside-avoid overflow-hidden cursor-pointer transition-all duration-200 mb-3"
      style={{
        borderRadius: 12,
        background: gradient,
        height,
        position: 'relative',
        border: hovered ? '1.5px solid hsl(var(--brand))' : '1.5px solid transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
          <span
            className="text-white font-medium"
            style={{
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {t('dashboard.create_similar')}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [discoverTab, setDiscoverTab] = useState<'explore' | 'templates'>('explore');

  const projectScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setProjects(listProjects()); }, []);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    t('dashboard.fallback_name');

  return (
    <div className="min-h-full px-4 sm:px-8 py-6 sm:py-7 space-y-8 sm:space-y-10">
      {/* Scoped Spotlight styles — cover-card (no global tokens touched) */}
      <style>{`
        .cydf {
          position: relative; display: flex; flex-direction: column; overflow: hidden; cursor: pointer;
          border-radius: 16px; background: hsl(var(--card)); border: 1px solid hsl(var(--border));
          box-shadow: 0 1px 2px rgba(20,16,12,.05);
          transition: transform .18s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .cydf:hover { transform: translateY(-4px); border-color: hsl(var(--brand) / .5); box-shadow: 0 24px 50px -24px rgba(20,16,12,.30); }
        .cydf-cap { position: relative; height: 128px; display: flex; align-items: flex-start; justify-content: space-between; padding: 14px; }
        .cydf-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.10) 42%, rgba(0,0,0,.48)); }
        .cydf-tile {
          position: relative; z-index: 2; display: grid; place-items: center; width: 40px; height: 40px;
          border-radius: 11px; background: rgba(255,255,255,.22); border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(4px);
        }
        .cydf-cost { position: relative; z-index: 2; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: rgba(0,0,0,.34); color: #fff; backdrop-filter: blur(4px); }
        .cydf-body { padding: 14px; }
        .cydf-title { font-size: 15px; font-weight: 700; color: hsl(var(--foreground)); }
        .cydf-desc { font-size: 12px; line-height: 1.45; color: hsl(var(--muted-foreground)); margin-top: 5px; }
      `}</style>

      {/* ── 1. Greeting ─────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          {t('dashboard.greeting', { name: firstName })}
        </h1>
        <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{t('dashboard.greeting_sub')}</p>
      </div>

      {/* ── 2. Criar — por categoria (carrosséis) ───── */}
      {FLOW_CATEGORIES.map((cat, ci) => {
        const entries = cat.ids
          .map((id) => (PRESET_FLOWS[id] ? ([id, PRESET_FLOWS[id]] as const) : null))
          .filter((x): x is readonly [string, PresetFlow] => x !== null);
        if (entries.length === 0) return null;
        return (
          <section key={cat.key} className="animate-fade-up" style={{ animationDelay: `${60 + ci * 40}ms` }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 12 }}>
              {t(cat.labelKey)}
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {entries.map(([id, flow]) => {
                const styleCount = FLOW_STYLES[id]?.length ?? 0;
                const chip = styleCount > 0
                  ? `${styleCount} ${t('studio.flow_selector.styles_chip')}`
                  : `${flow.credits} cr`;
                const label = lang === 'en' ? flow.nameEn : lang === 'es' ? flow.nameEs : flow.name;
                const desc = lang === 'en' ? flow.descriptionEn : lang === 'es' ? flow.descriptionEs : flow.description;
                return (
                  <FlowCard
                    key={id}
                    flow={flow}
                    label={label}
                    desc={desc}
                    chip={chip}
                    onClick={() => navigate(`/app/create/studio?flow=${id}`)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ── 3. My Projects ──────────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <SectionHeader
          title={t('dashboard.recent_projects')}
          onViewAll={() => navigate('/app/projects')}
          scrollRef={projectScrollRef}
        />

        {projects.length === 0 ? (
          <div style={{ maxWidth: 480 }}>
            <div className="bg-card border border-border rounded-2xl">
              <EmptyState
                icon={<FolderOpen className="w-6 h-6" />}
                title={t('projects.empty_title')}
                description={t('dashboard.empty_description')}
                ctaLabel={t('projects.new_project')}
                onCta={() => navigate('/app/create')}
              />
            </div>
          </div>
        ) : (
          <div ref={projectScrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* New project button */}
            <button
              onClick={() => navigate('/app/create')}
              className="shrink-0 flex flex-col items-center justify-center gap-2 transition-all"
              style={{
                width: 180,
                height: 135,
                borderRadius: 10,
                border: '2px dashed hsl(var(--border))',
                color: 'hsl(var(--muted-foreground))',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--brand))';
                (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))';
                (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))';
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: 10, background: 'hsl(var(--muted))' }}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{t('projects.new_project')}</span>
            </button>

            {projects.slice(0, 8).map((p, idx) => (
              <ProjectCard
                key={p.id}
                project={p}
                gradient={PROJECT_GRADIENTS[idx % PROJECT_GRADIENTS.length]}
                onClick={() => navigate(`/app/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Discover gallery ─────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t('dashboard.discover')}</h2>
          <div
            className="flex"
            style={{ padding: 2, background: 'hsl(var(--muted))', borderRadius: 8 }}
          >
            {(['explore', 'templates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDiscoverTab(tab)}
                className="transition-all duration-150"
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: discoverTab === tab ? 600 : 400,
                  color: discoverTab === tab ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  borderRadius: 6,
                  background: discoverTab === tab ? 'hsl(var(--card))' : 'transparent',
                  boxShadow: discoverTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t(`dashboard.discover_tab_${tab}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="columns-2 sm:columns-3 lg:columns-4 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ columnGap: 12 }}>
          {DISCOVER.map((item, i) => (
            <DiscoverItem key={i} gradient={item.gradient} height={item.h} />
          ))}
        </div>

        <div className="flex justify-center mt-5">
          <button
            onClick={() => navigate('/app/templates')}
            className="transition-colors"
            style={{
              padding: '10px 32px',
              borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: 500,
              color: 'hsl(var(--muted-foreground))',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--brand))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
          >
            {t('dashboard.view_more')}
          </button>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
