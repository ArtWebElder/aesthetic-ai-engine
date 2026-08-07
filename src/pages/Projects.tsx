import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal,
  FolderOpen, Image, ExternalLink, Copy, Trash2, Edit2, Download, Workflow,
} from 'lucide-react';
import { ConfirmModal } from '@/components/creatyng/ConfirmModal';
import { Button } from '@/components/ui/button';
import { listProjects, deleteProject, createProject } from '@/features/projects/store';
import { listStudioProjects, deleteStudioProject, type StudioProject } from '@/services/studioProjects';
import { useI18n } from '@/i18n';
import { useToast } from '@/features/toast/useToast';
import type { Project } from '@/types/spec';

type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'name' | 'credits';
type FilterType = 'all' | 'Food/Pop' | 'Pop Design';

/* ─── Project hue/color map (deterministic by index) ─── */
const PROJECT_COLORS = ['#7C3AED', '#C0FF3E', '#EC4899', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#1E293B', '#10B981'];

/* ─── Action Dropdown ─────────────────────────────────── */
function ActionMenu({ open, onClose, onAction }: { open: boolean; onClose: () => void; onAction: (a: string) => void }) {
  const { t } = useI18n();
  if (!open) return null;
  const items = [
    { id: 'open', label: t('projects.action.open_project'), Icon: Image },
    { id: 'rename', label: t('projects.action.rename'), Icon: Edit2 },
    { id: 'duplicate', label: t('projects.action.duplicate'), Icon: Copy },
    { id: 'download', label: t('projects.action.export'), Icon: Download },
    null,
    { id: 'delete', label: t('projects.action.delete'), Icon: Trash2, danger: true },
  ];
  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 168,
      background: 'hsl(var(--card))',
      borderRadius: 14, border: '1px solid hsl(var(--border))',
      boxShadow: '0 18px 40px -18px rgba(20,16,12,.35)',
      padding: 5, zIndex: 20, animation: 'fdUp 120ms ease both',
    }}>
      {items.map((item, i) => item === null ? (
        <div key={i} style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 0' }} />
      ) : (
        <button key={i} onClick={() => { onAction(item.id); onClose(); }} style={{
          width: '100%', padding: '8px 10px', borderRadius: 9, border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'left',
          color: item.danger ? '#EF4444' : 'hsl(var(--foreground))',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'background 80ms',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = item.danger ? 'rgba(239,68,68,0.05)' : 'hsl(var(--muted))'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <item.Icon size={14} color={item.danger ? '#EF4444' : 'hsl(var(--muted-foreground))'} />{item.label}
        </button>
      ))}
    </div>
  );
}

const Projects = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [hovId, setHovId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [studioFlows, setStudioFlows] = useState<StudioProject[]>([]);
  const [confirmDeleteFlow, setConfirmDeleteFlow] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => { setProjects(listProjects()); }, []);
  useEffect(() => { listStudioProjects().then(setStudioFlows); }, []);

  const handleDeleteFlow = async (id: string) => {
    try {
      await deleteStudioProject(id);
      setStudioFlows(prev => prev.filter(f => f.id !== id));
      toast.success(t('projects.toast.deleted'));
    } catch {
      toast.error(t('projects.toast.delete_failed'));
    }
    setConfirmDeleteFlow(null);
  };
  useEffect(() => {
    const h = () => setMenuOpen(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const filtered = useMemo(() => {
    let list = projects.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [projects, filter, search, sort]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(listProjects());
    setConfirmDelete(null);
    toast.success(t('projects.toast.deleted'));
  };

  const handleDuplicate = (p: Project) => {
    createProject(`${p.name} ${t('projects.copy_suffix')}`, p.spec.format);
    setProjects(listProjects());
    toast.success(t('projects.toast.duplicated'));
  };

  const totalVersions = projects.length * 2; // approximate

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: '100%', color: 'hsl(var(--foreground))',
      padding: isMobile ? '18px 16px 40px' : '24px 32px 48px',
    }}>
      {/* Scoped Spotlight styles — cover-card + toolbar (no global tokens touched) */}
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        select:focus{outline:none}input:focus{outline:none}

        .cypj {
          position: relative; display: flex; flex-direction: column; overflow: hidden; cursor: pointer;
          border-radius: 16px; background: hsl(var(--card)); border: 1px solid hsl(var(--border));
          box-shadow: 0 1px 2px rgba(20,16,12,.05);
          transition: transform .18s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .cypj:hover { transform: translateY(-4px); border-color: hsl(var(--brand) / .5); box-shadow: 0 24px 50px -24px rgba(20,16,12,.30); }
        .cypj-cap { position: relative; height: 132px; display: flex; align-items: flex-start; justify-content: space-between; padding: 12px; }
        .cypj-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.10) 42%, rgba(0,0,0,.48)); }
        .cypj-tile {
          position: relative; z-index: 2; display: grid; place-items: center; width: 40px; height: 40px;
          border-radius: 11px; background: rgba(255,255,255,.22); border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(4px);
        }
        .cypj-glass { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; }
        .cypj-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: rgba(0,0,0,.34); color: #fff; backdrop-filter: blur(4px); }
        .cypj-menu {
          display: grid; place-items: center; width: 26px; height: 26px; border-radius: 999px; border: none; cursor: pointer;
          background: rgba(0,0,0,.34); color: #fff; backdrop-filter: blur(4px); transition: opacity .15s ease;
        }
        .cypj-body { padding: 13px 14px; }

        .cypj-chip {
          height: 36px; padding: 0 16px; border-radius: 999px; cursor: pointer; font-family: inherit;
          font-size: 13px; font-weight: 600; border: 1px solid hsl(var(--border));
          background: hsl(var(--card)); color: hsl(var(--muted-foreground)); transition: all .15s ease;
        }
        .cypj-chip:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
        .cypj-chip[data-on="true"] { background: hsl(var(--brand) / .10); color: hsl(var(--brand)); border-color: hsl(var(--brand) / .35); }

        .cypj-seg { display: flex; gap: 2px; padding: 4px; border-radius: 14px; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); }
        .cypj-seg button {
          width: 34px; height: 32px; border: none; background: transparent; color: hsl(var(--muted-foreground));
          border-radius: 9px; cursor: pointer; display: grid; place-items: center; transition: all .15s ease;
        }
        .cypj-seg button:hover { color: hsl(var(--foreground)); }
        .cypj-seg button[data-on="true"] { background: hsl(var(--brand) / .10); color: hsl(var(--brand)); }

        .cypj-empty {
          width: 100%; max-width: 420px; text-align: center; padding: 44px 32px;
          border: 1px dashed hsl(var(--border)); border-radius: 26px; background: hsl(var(--card));
        }
        .cypj-empty-ic {
          width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 20px; display: grid; place-items: center;
          background: hsl(var(--brand) / .10); color: hsl(var(--brand)); border: 1px solid hsl(var(--brand) / .24);
        }
      `}</style>

      {/* Title + Actions */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24,
        animation: ready ? 'fdUp 450ms ease both' : 'none',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 4 }}>{t('projects.my_title')}</h1>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>{t('projects.count', { count: projects.length })} · {t('projects.versions_count', { count: totalVersions })}</p>
        </div>
        <Button
          variant="gradient"
          onClick={() => navigate('/app/create')}
          style={{ height: 42, padding: '0 20px', fontSize: 13.5, flexShrink: 0 }}
        >
          <Plus size={16} />{t('projects.new_project')}
        </Button>
      </div>

      {/* Filters bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26, gap: 12,
        animation: ready ? 'fdUp 450ms 40ms ease both' : 'none', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 13px',
            background: 'hsl(var(--card))', borderRadius: 14, border: '1px solid hsl(var(--border))',
            width: isMobile ? '100%' : 240,
          }}>
            <Search size={16} color="hsl(var(--muted-foreground))" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('projects.search_placeholder')}
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 13.5, fontFamily: 'inherit', color: 'hsl(var(--foreground))' }}
            />
          </div>
          {/* Filter chips */}
          {(['all', 'Food/Pop', 'Pop Design'] as FilterType[]).map(f => (
            <button key={f} className="cypj-chip" data-on={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? t('projects.all') : f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortMode)}
            style={{
              height: 36, padding: '0 12px', borderRadius: 12, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))', fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
            }}
          >
            <option value="recent">{t('projects.sort.recent')}</option>
            <option value="name">{t('projects.sort.name_az')}</option>
          </select>
          {/* View toggle */}
          <div className="cypj-seg">
            {([
              { m: 'grid' as ViewMode, Icon: LayoutGrid },
              { m: 'list' as ViewMode, Icon: List },
            ] as const).map(({ m, Icon }) => (
              <button key={m} data-on={view === m} onClick={() => setView(m)}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: isMobile ? 10 : 14 }}>
          {filtered.map((p, i) => {
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
            const isHov = hovId === p.id;
            return (
              <div key={p.id} className="cypj" style={{
                animation: ready ? `scIn 320ms ${40 + i * 35}ms ease both` : 'none',
              }}
                onMouseEnter={() => setHovId(p.id)}
                onMouseLeave={() => setHovId(null)}
                onClick={() => navigate(`/app/projects/${p.id}`)}
              >
                {/* Capa (hue gradient) + glass tile + version pill */}
                <div className="cypj-cap" style={{ background: `linear-gradient(140deg, ${color}, rgba(20,20,23,0.55))` }}>
                  <div className="cypj-overlay" />
                  <div className="cypj-tile">
                    <Image size={18} color="#ffffff" />
                  </div>
                  <div className="cypj-glass" onClick={e => e.stopPropagation()}>
                    <span className="cypj-pill">{t('projects.one_version')}</span>
                    <div style={{ position: 'relative' }}>
                      <button
                        className="cypj-menu"
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                        style={{ opacity: isMobile || isHov || menuOpen === p.id ? 1 : 0 }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      <ActionMenu
                        open={menuOpen === p.id}
                        onClose={() => setMenuOpen(null)}
                        onAction={a => {
                          if (a === 'open') navigate(`/app/projects/${p.id}`);
                          if (a === 'duplicate') handleDuplicate(p);
                          if (a === 'delete') setConfirmDelete(p.id);
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="cypj-body">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '3px 9px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(p.spec as any)?.module?.replace('_', ' ') || 'project'}
                    </span>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
                      {new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && filtered.length > 0 && (
        <div style={{ background: 'hsl(var(--card))', borderRadius: 20, border: '1px solid hsl(var(--border))', overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,16,12,.05)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '2fr 1fr 1fr 1fr 80px', gap: 8, padding: '12px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
            {(isMobile ? [t('projects.col.project'), ''] : [t('projects.col.project'), t('projects.col.template'), t('projects.col.versions'), t('projects.col.date'), '']).map((h, i) => (
              <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((p, i) => {
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
            return (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: isMobile ? '1fr 80px' : '2fr 1fr 1fr 1fr 80px', gap: 8, padding: '12px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                cursor: 'pointer', transition: 'background 100ms', alignItems: 'center',
                animation: ready ? `fdUp 300ms ${i * 30}ms ease both` : 'none',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                onClick={() => navigate(`/app/projects/${p.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Image size={15} color={color} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                </div>
                {!isMobile && (
                  <>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{(p.spec as any)?.module?.replace('_', ' ') || 'project'}</span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>1</span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </>
                )}
                <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  {[
                    { Icon: Edit2, danger: false },
                    { Icon: Copy, danger: false },
                    { Icon: Trash2, danger: true },
                  ].map(({ Icon, danger }, j) => (
                    <button key={j} style={{
                      width: 28, height: 28, borderRadius: 9, border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: danger ? '#EF4444' : 'hsl(var(--muted-foreground))', transition: 'all 100ms',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(239,68,68,0.05)' : 'hsl(var(--muted))'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card))'}
                      onClick={() => { if (danger) setConfirmDelete(p.id); else if (j === 1) handleDuplicate(p); }}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div style={{ display: 'grid', placeItems: 'center', padding: '50px 0' }}>
          <div className="cypj-empty" style={{ animation: ready ? 'fdUp 450ms 80ms ease both' : 'none' }}>
            <div className="cypj-empty-ic">
              <FolderOpen size={30} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {search ? t('projects.empty') : t('projects.empty_title')}
            </h3>
            <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, margin: '9px 0 22px' }}>
              {search ? t('projects.empty_search_hint') : t('projects.empty_create_hint')}
            </p>
            {!search && (
              <Button
                variant="gradient"
                onClick={() => navigate('/app/create')}
                style={{ height: 44, padding: '0 20px', fontSize: 14 }}
              >
                <Plus size={17} />{t('projects.create_first')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Studio flows — saved node-editor projects (Supabase) */}
      {studioFlows.length > 0 && (
        <div style={{ marginTop: 36, animation: ready ? 'fdUp 450ms 120ms ease both' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Workflow size={16} color="hsl(var(--brand))" />
            <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('projects.studio_flows_title')}</h2>
            <span style={{
              fontSize: 11.5, fontWeight: 600, color: 'hsl(var(--brand))',
              background: 'hsl(var(--brand) / .10)', padding: '2px 9px', borderRadius: 999,
            }}>{studioFlows.length}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}>
            {studioFlows.map(f => (
              <div
                key={f.id}
                className="cypj"
                onClick={() => navigate(`/app/create/studio?project=${f.id}`)}
              >
                <div style={{
                  aspectRatio: '16 / 10',
                  background: f.thumbnail ? `center/cover no-repeat url(${f.thumbnail})` : 'hsl(var(--muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!f.thumbnail && <Workflow size={26} color="hsl(var(--muted-foreground))" />}
                </div>
                <div style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteFlow(f.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', padding: 2, flexShrink: 0 }}
                    title={t('projects.delete_confirm.confirm')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        title={t('projects.delete_confirm.title')}
        description={t('projects.delete_confirm.desc')}
        confirmLabel={t('projects.delete_confirm.confirm')}
        variant="danger"
      />

      <ConfirmModal
        open={confirmDeleteFlow !== null}
        onConfirm={() => confirmDeleteFlow && handleDeleteFlow(confirmDeleteFlow)}
        onCancel={() => setConfirmDeleteFlow(null)}
        title={t('projects.delete_confirm.title')}
        description={t('projects.delete_confirm.desc')}
        confirmLabel={t('projects.delete_confirm.confirm')}
        variant="danger"
      />
    </div>
  );
};

export default Projects;
