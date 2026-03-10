import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal,
  FolderOpen, Image, ExternalLink, Copy, Trash2, ChevronDown,
} from 'lucide-react';
import { Button, Badge, EmptyState, Dropdown } from '@/components/creatyng';
import type { DropdownItem } from '@/components/creatyng';
import ProjectWizard from '@/components/ProjectWizard';
import { listProjects, deleteProject, createProject } from '@/features/projects/store';
import { useI18n } from '@/i18n';
import type { Project } from '@/types/spec';

type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'name';
type FilterType = 'all' | 'social_post' | 'ecom_banner' | 'photoshoot';

const GRADS = [
  'from-orange-400 to-rose-500', 'from-violet-500 to-purple-600',
  'from-cyan-500 to-teal-500', 'from-amber-400 to-orange-500',
  'from-blue-500 to-indigo-500', 'from-emerald-500 to-green-400',
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const FILTERS: { id: FilterType; labelKey: string }[] = [
  { id: 'all', labelKey: 'projects.filter.all' },
  { id: 'social_post', labelKey: 'project_type.social_post' },
  { id: 'ecom_banner', labelKey: 'project_type.ecom_banner' },
  { id: 'photoshoot', labelKey: 'project_type.photoshoot' },
];

const Projects = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => { setProjects(listProjects()); }, [createOpen]);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      if (filter !== 'all' && (p.spec as any)?.module !== filter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [projects, filter, search, sort]);

  const handleDelete = (id: string) => { deleteProject(id); setProjects(listProjects()); };
  const handleDuplicate = (p: Project) => { createProject(`${p.name} ${t('common.copy_suffix')}`, p.spec.format); setProjects(listProjects()); };

  const makeMenu = (p: Project): DropdownItem[] => [
    { label: t('projects.action.open'), icon: <ExternalLink className="w-3.5 h-3.5" />, onClick: () => navigate(`/app/projects/${p.id}`) },
    { label: t('projects.action.duplicate'), icon: <Copy className="w-3.5 h-3.5" />, onClick: () => handleDuplicate(p) },
    { divider: true } as DropdownItem,
    { label: t('projects.action.delete'), icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDelete(p.id), danger: true },
  ];

  return (
    <div className="min-h-full px-6 py-7 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('projects.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('projects.count', { count: projects.length })}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />{t('projects.new_project')}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('projects.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                filter === f.id
                  ? 'bg-creatyng-accent-pale border-creatyng-accent text-creatyng-accent'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-3 text-xs bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all"
          >
            {sort === 'recent' ? t('projects.sort.recent') : t('projects.sort.name')}
            <ChevronDown className="h-3 w-3" />
          </button>
          {sortOpen && (
            <div className="absolute top-full mt-1.5 right-0 z-20 bg-white border border-[rgba(20,20,23,0.06)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] py-1 min-w-[140px] animate-dropdown-in">
              {(['recent', 'name'] as SortMode[]).map((s) => (
                <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${sort === s ? 'text-[#ff713d] bg-[#FFF0EA]' : 'text-[#141417] hover:bg-[rgba(20,20,23,0.04)]'}`}>
                  {t(`projects.sort.${s}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex p-0.5 bg-muted rounded-lg">
          {[{ m: 'grid' as ViewMode, Icon: LayoutGrid }, { m: 'list' as ViewMode, Icon: List }].map(({ m, Icon }) => (
            <button key={m} onClick={() => setView(m)}
              className={`p-1.5 rounded-md transition-all ${view === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-6 h-6" />}
          title={t('projects.empty_title')}
          description={t('projects.empty_subtitle')}
          ctaLabel={t('projects.new_project')}
          onCta={() => setCreateOpen(true)}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, idx) => (
            <div key={p.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(255,113,61,0.10)] transition-all duration-200 cursor-pointer animate-scale-in"
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => navigate(`/app/projects/${p.id}`)}>
              <div className={`h-36 bg-gradient-to-br ${GRADS[idx % GRADS.length]} relative`}>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Image className="w-10 h-10 text-white" />
                </div>
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    trigger={<button className="h-7 w-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"><MoreHorizontal className="h-4 w-4" /></button>}
                    items={makeMenu(p)} align="right" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
                  <Badge variant="default" className="shrink-0 text-[10px]">{(p.spec as any)?.module?.replace('_', ' ') || 'project'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{fmtDate(p.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">{t('projects.col.project')}</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t('projects.col.template')}</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t('projects.col.date')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('projects.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => navigate(`/app/projects/${p.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRADS[idx % GRADS.length]} shrink-0`} />
                      <span className="font-medium text-foreground line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="default" className="text-[10px]">{(p.spec as any)?.module?.replace('_', ' ') || 'project'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      trigger={<button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal className="h-4 w-4" /></button>}
                      items={makeMenu(p)} align="right" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Projects;
