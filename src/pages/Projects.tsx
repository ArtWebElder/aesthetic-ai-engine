import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal,
  FolderOpen, Image, ExternalLink, Copy, Trash2, Edit2, Download,
} from 'lucide-react';
import { ConfirmModal } from '@/components/creatyng/ConfirmModal';
import ProjectWizard from '@/components/ProjectWizard';
import { listProjects, deleteProject, createProject } from '@/features/projects/store';
import { useI18n } from '@/i18n';
import { useToast } from '@/features/toast/useToast';
import type { Project } from '@/types/spec';

type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'name' | 'credits';
type FilterType = 'all' | 'Food/Pop' | 'Pop Design';

/* ─── Project hue/color map (deterministic by index) ─── */
const PROJECT_HUES = [270, 15, 330, 160, 190, 38, 340, 210, 165];
const PROJECT_COLORS = ['#7C3AED', '#ff713d', '#EC4899', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#1E293B', '#10B981'];

/* ─── Action Dropdown ─────────────────────────────────── */
function ActionMenu({ open, onClose, onAction }: { open: boolean; onClose: () => void; onAction: (a: string) => void }) {
  if (!open) return null;
  const items = [
    { id: 'open', label: 'Abrir projeto', Icon: Image },
    { id: 'rename', label: 'Renomear', Icon: Edit2 },
    { id: 'duplicate', label: 'Duplicar', Icon: Copy },
    { id: 'download', label: 'Exportar', Icon: Download },
    null,
    { id: 'delete', label: 'Excluir', Icon: Trash2, danger: true },
  ];
  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 160, background: '#ffffff',
      borderRadius: 10, border: '1px solid rgba(20,20,23,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      padding: 4, zIndex: 20, animation: 'fdUp 120ms ease both',
    }}>
      {items.map((item, i) => item === null ? (
        <div key={i} style={{ height: 1, background: 'rgba(20,20,23,0.06)', margin: '3px 0' }} />
      ) : (
        <button key={i} onClick={() => { onAction(item.id); onClose(); }} style={{
          width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left',
          color: item.danger ? '#EF4444' : '#141417', display: 'flex', alignItems: 'center', gap: 8,
          transition: 'background 80ms',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = item.danger ? 'rgba(239,68,68,0.05)' : 'rgba(20,20,23,0.03)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <item.Icon size={14} color={item.danger ? '#EF4444' : '#8e8e96'} />{item.label}
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
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [hovId, setHovId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => { setProjects(listProjects()); }, [createOpen]);
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
    toast.success('Projeto excluído');
  };

  const handleDuplicate = (p: Project) => {
    createProject(`${p.name} (cópia)`, p.spec.format);
    setProjects(listProjects());
    toast.success('Projeto duplicado!');
  };

  const totalVersions = projects.length * 2; // approximate

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.14)' stroke-width='0.6'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: '100%', color: '#141417',
      padding: '24px 32px 48px',
    }}>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        select:focus{outline:none}input:focus{outline:none}
      `}</style>

      {/* Title + Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
        animation: ready ? 'fdUp 450ms ease both' : 'none',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Meus Projetos</h1>
          <p style={{ fontSize: 13, color: '#8e8e96' }}>{projects.length} projetos · {totalVersions} versões</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 10px rgba(255,113,61,0.27)',
          }}
        >
          <Plus size={15} />Novo Projeto
        </button>
      </div>

      {/* Filters bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10,
        animation: ready ? 'fdUp 450ms 40ms ease both' : 'none', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px',
            background: '#ffffff', borderRadius: 8, border: '1px solid rgba(20,20,23,0.1)', width: 220,
          }}>
            <Search size={14} color="#b5b5bb" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar projeto..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12.5, fontFamily: 'inherit', color: '#141417' }}
            />
          </div>
          {/* Filter pills */}
          {(['all', 'Food/Pop', 'Pop Design'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              border: filter === f ? '1.5px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
              background: filter === f ? '#FFF0EA' : '#ffffff',
              color: filter === f ? '#ff713d' : '#5a5a60', fontWeight: filter === f ? 600 : 400,
              transition: 'all 150ms',
            }}>{f === 'all' ? 'Todos' : f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortMode)}
            style={{
              padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(20,20,23,0.1)',
              background: '#ffffff', fontSize: 12, fontFamily: 'inherit', color: '#5a5a60', cursor: 'pointer',
            }}
          >
            <option value="recent">Mais recentes</option>
            <option value="name">Nome A-Z</option>
          </select>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(20,20,23,0.04)', borderRadius: 7, padding: 2 }}>
            {([
              { m: 'grid' as ViewMode, Icon: LayoutGrid },
              { m: 'list' as ViewMode, Icon: List },
            ] as const).map(({ m, Icon }) => (
              <button key={m} onClick={() => setView(m)} style={{
                width: 30, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                background: view === m ? '#ffffff' : 'transparent',
                color: view === m ? '#141417' : '#b5b5bb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: view === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map((p, i) => {
            const hue = PROJECT_HUES[i % PROJECT_HUES.length];
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
            const isHov = hovId === p.id;
            return (
              <div key={p.id} style={{
                background: '#ffffff', borderRadius: 12, overflow: 'hidden',
                border: isHov ? '1.5px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                boxShadow: '0 1px 3px rgba(20,20,23,0.04)', cursor: 'pointer', transition: 'all 180ms', position: 'relative',
                ...(isHov ? { background: 'linear-gradient(180deg, #FFF0EA 0%, #ffffff 40%)' } : {}),
                animation: ready ? `scIn 320ms ${40 + i * 35}ms ease both` : 'none',
              }}
                onMouseEnter={() => setHovId(p.id)}
                onMouseLeave={() => setHovId(null)}
                onClick={() => navigate(`/app/projects/${p.id}`)}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 130,
                  background: `linear-gradient(145deg, hsl(${hue} 55% 94%), hsl(${hue} 45% 87%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${color}30`,
                  }}>
                    <Image size={20} color="#fff" />
                  </div>
                  {/* Version badge */}
                  <div style={{
                    position: 'absolute', top: 8, left: 8, padding: '2px 7px', borderRadius: 5,
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                    fontSize: 10, fontWeight: 600, color: '#5a5a60',
                  }}>1 versão</div>
                  {/* More menu */}
                  <div style={{ position: 'absolute', top: 8, right: 8 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                      style={{
                        width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a60',
                        opacity: isHov ? 1 : 0, transition: 'opacity 150ms',
                      }}
                    >
                      <MoreHorizontal size={16} />
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
                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#141417', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#5a5a60', background: '#f5f5f3', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                      {(p.spec as any)?.module?.replace('_', ' ') || 'project'}
                    </span>
                    <span style={{ fontSize: 11, color: '#b5b5bb' }}>
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
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid rgba(20,20,23,0.06)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(20,20,23,0.06)' }}>
            {['Projeto', 'Template', 'Versões', 'Data', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: '#b5b5bb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((p, i) => {
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
            return (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 8, padding: '11px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(20,20,23,0.06)' : 'none',
                cursor: 'pointer', transition: 'background 100ms', alignItems: 'center',
                animation: ready ? `fdUp 300ms ${i * 30}ms ease both` : 'none',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(20,20,23,0.015)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                onClick={() => navigate(`/app/projects/${p.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Image size={14} color={color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#141417' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#5a5a60' }}>{(p.spec as any)?.module?.replace('_', ' ') || 'project'}</span>
                <span style={{ fontSize: 12, color: '#5a5a60' }}>1</span>
                <span style={{ fontSize: 12, color: '#8e8e96' }}>{new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  {[
                    { Icon: Edit2, danger: false },
                    { Icon: Copy, danger: false },
                    { Icon: Trash2, danger: true },
                  ].map(({ Icon, danger }, j) => (
                    <button key={j} style={{
                      width: 26, height: 26, borderRadius: 5, border: '1px solid rgba(20,20,23,0.06)',
                      background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: danger ? '#EF4444' : '#8e8e96', transition: 'all 100ms',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(239,68,68,0.05)' : '#f5f5f3'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ffffff'}
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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div style={{
            background: '#ffffff', borderRadius: 18, border: '1px solid rgba(20,20,23,0.06)',
            padding: '44px 32px', textAlign: 'center', width: 340, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, rgba(255,113,61,0.06), transparent)' }} />
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(255,113,61,0.08)',
              border: '1px solid rgba(255,113,61,0.12)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: '#ff713d', position: 'relative',
            }}>
              <FolderOpen size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, position: 'relative' }}>
              {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            </h3>
            <p style={{ fontSize: 12.5, color: '#8e8e96', lineHeight: 1.5, marginBottom: 20, position: 'relative' }}>
              {search ? 'Tente ajustar os filtros ou o termo de busca.' : 'Crie seu primeiro criativo profissional e ele aparecerá aqui.'}
            </p>
            {!search && (
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  padding: '9px 22px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(255,113,61,0.20)', position: 'relative',
                }}
              >
                <Plus size={14} />Criar primeiro projeto
              </button>
            )}
          </div>
        </div>
      )}

      <ProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmModal
        open={confirmDelete !== null}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        title="Excluir projeto?"
        description="Esta ação não pode ser desfeita. O projeto será removido permanentemente."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};

export default Projects;
