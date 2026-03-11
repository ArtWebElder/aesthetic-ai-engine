import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils, Sparkles, BookOpen, Zap, ChevronLeft, ChevronRight,
  FolderOpen, Plus, Image,
} from 'lucide-react';
import { EmptyState } from '@/components/creatyng';
import { listProjects } from '@/features/projects/store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import type { Project } from '@/types/spec';
import { useEffect } from 'react';

/* ── Feature cards ────────────────────────────────────── */
const FEATURES = [
  {
    id: 'food_pop',
    labelKey: 'dashboard.feature.food_pop',
    descKey: 'dashboard.feature.food_pop_desc',
    gradient: 'linear-gradient(135deg, #f97316, #e11d48)',
    Icon: Utensils,
    badgeLabel: 'Popular',
    badgeBg: '#ff713d',
    active: true,
  },
  {
    id: 'pop_design',
    labelKey: 'dashboard.feature.pop_design',
    descKey: 'dashboard.feature.pop_design_desc',
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    Icon: Sparkles,
    badgeLabel: 'Novo',
    badgeBg: '#7C3AED',
    active: true,
  },
  {
    id: 'editorial',
    labelKey: 'dashboard.feature.editorial',
    descKey: 'dashboard.feature.editorial_desc',
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    Icon: BookOpen,
    badgeLabel: 'Em breve',
    badgeBg: null,
    active: false,
  },
  {
    id: 'neon',
    labelKey: 'dashboard.feature.neon',
    descKey: 'dashboard.feature.neon_desc',
    gradient: 'linear-gradient(135deg, #a855f7, #06b6d4)',
    Icon: Zap,
    badgeLabel: 'Em breve',
    badgeBg: null,
    active: false,
  },
];

/* ── Discover mosaic data ─────────────────────────────── */
const DISCOVER = [
  { gradient: 'linear-gradient(135deg, #f97316, #e11d48)', h: 176 },
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
  'linear-gradient(135deg, #f97316, #e11d48)',
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
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#141417' }}>{title}</h2>
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
                  border: '1px solid rgba(20,20,23,0.1)',
                  background: '#ffffff',
                  color: '#8e8e96',
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
            style={{ fontSize: 12.5, color: '#8e8e96' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ff713d'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8e8e96'; }}
          >
            {t('common.view_all')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Feature card ────────────────────────────────────── */
function FeatureCard({ f, onNavigate }: { f: typeof FEATURES[0]; onNavigate: () => void }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: 195,
        height: 155,
        borderRadius: 12,
        background: f.gradient,
        opacity: f.active ? 1 : 0.55,
        cursor: f.active ? 'pointer' : 'default',
      }}
      onMouseEnter={() => f.active && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => f.active && onNavigate()}
    >
      {/* Content */}
      <div className="relative z-10 p-[14px] h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)' }}
          >
            <f.Icon style={{ width: 18, height: 18, color: '#ffffff' }} />
          </div>
          <span
            className="text-white"
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 20,
              background: f.badgeBg || 'rgba(255,255,255,0.15)',
              backdropFilter: f.badgeBg ? 'none' : 'blur(6px)',
              border: f.badgeBg ? 'none' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {t(('dashboard.badge.' + (f.badgeLabel === 'Popular' ? 'popular' : f.badgeLabel === 'Novo' ? 'new' : 'coming')) as string) || f.badgeLabel}
          </span>
        </div>
        <div className="mt-auto">
          <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }} className="line-clamp-2">
            {t(f.labelKey)}
          </p>
        </div>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
        >
          <button
            className="transition-colors"
            style={{
              background: '#ffffff',
              color: '#141417',
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 16px',
              borderRadius: 8,
            }}
          >
            {t('dashboard.create_now')}
          </button>
          <p className="text-white/80 text-center px-4 line-clamp-2" style={{ fontSize: 10.5 }}>
            {t(f.descKey)}
          </p>
        </div>
      )}
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
        border: hovered ? '1.5px solid #ff713d' : '1px solid rgba(20,20,23,0.08)',
        background: hovered ? 'linear-gradient(to bottom, #FFF0EA, #ffffff)' : '#ffffff',
        boxShadow: hovered ? '0 4px 16px rgba(255,113,61,0.12)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ height: 100, background: gradient }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Image className="w-8 h-8 text-white" />
        </div>
        <div
          className="absolute top-2 left-2 rounded-full"
          style={{ width: 8, height: 8, background: '#ff713d' }}
        />
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        <p className="line-clamp-1" style={{ fontSize: 13, fontWeight: 600, color: '#141417' }}>
          {project.name}
        </p>
        <p style={{ fontSize: 11, color: '#b5b5bb', marginTop: 2 }}>
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
        border: hovered ? '1.5px solid #ff713d' : '1.5px solid transparent',
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
  const { t } = useI18n();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [discoverTab, setDiscoverTab] = useState<'explore' | 'templates'>('explore');

  const featureScrollRef = useRef<HTMLDivElement>(null);
  const projectScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setProjects(listProjects()); }, []);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    t('dashboard.fallback_name');

  return (
    <div className="min-h-full px-8 py-7 space-y-10">

      {/* ── 1. Greeting ─────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#141417' }}>
          {t('dashboard.greeting', { name: firstName })}
        </h1>
        <p style={{ fontSize: 14, color: '#5a5a60', marginTop: 2 }}>{t('dashboard.greeting_sub')}</p>
      </div>

      {/* ── 2. Quick start ──────────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <SectionHeader
          title={t('dashboard.quick_create')}
          onViewAll={() => navigate('/app/templates')}
          scrollRef={featureScrollRef}
        />
        <div ref={featureScrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} f={f} onNavigate={() => navigate('/app/create')} />
          ))}
        </div>
      </section>

      {/* ── 3. My Projects ──────────────────────────── */}
      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <SectionHeader
          title={t('dashboard.recent_projects')}
          onViewAll={() => navigate('/app/projects')}
          scrollRef={projectScrollRef}
        />

        {projects.length === 0 ? (
          <div className="bg-white border rounded-2xl" style={{ borderColor: 'rgba(20,20,23,0.08)' }}>
            <EmptyState
              icon={<FolderOpen className="w-6 h-6" />}
              title={t('projects.empty_title')}
              description={t('dashboard.empty_description')}
              ctaLabel={t('projects.new_project')}
              onCta={() => navigate('/app/create')}
            />
          </div>
        ) : (
          <div ref={projectScrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {/* New project button */}
            <button
              onClick={() => navigate('/app/create')}
              className="shrink-0 flex flex-col items-center justify-center gap-2 transition-all"
              style={{
                width: 180,
                height: 135,
                borderRadius: 10,
                border: '2px dashed rgba(20,20,23,0.12)',
                color: '#8e8e96',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff713d';
                (e.currentTarget as HTMLButtonElement).style.color = '#ff713d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(20,20,23,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = '#8e8e96';
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(20,20,23,0.04)' }}
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
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#141417' }}>{t('dashboard.discover')}</h2>
          <div
            className="flex"
            style={{ padding: 2, background: 'rgba(20,20,23,0.04)', borderRadius: 8 }}
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
                  color: discoverTab === tab ? '#141417' : '#8e8e96',
                  borderRadius: 6,
                  background: discoverTab === tab ? '#ffffff' : 'transparent',
                  boxShadow: discoverTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t(`dashboard.discover_tab_${tab}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="columns-2 sm:columns-3 lg:columns-4" style={{ columnGap: 12 }}>
          {DISCOVER.map((item, i) => (
            <DiscoverItem key={i} gradient={item.gradient} height={item.h} />
          ))}
        </div>

        <div className="flex justify-center mt-5">
          <button
            onClick={() => navigate('/app/templates')}
            className="w-full transition-colors"
            style={{
              padding: '10px 0',
              borderRadius: 10,
              border: '1px solid rgba(20,20,23,0.1)',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#5a5a60',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff713d'; (e.currentTarget as HTMLButtonElement).style.color = '#ff713d'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(20,20,23,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#5a5a60'; }}
          >
            {t('dashboard.view_more')}
          </button>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
