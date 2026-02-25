import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus, Sparkles, MoreHorizontal, Pencil, Trash2, Copy, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MiniProductionChart from '@/components/MiniProductionChart';
import ProjectWizard from '@/components/ProjectWizard';
import { mockCredits, mockGenerations } from '@/lib/mocks/data';
import { listProjects, deleteProject, createProject } from '@/features/projects/store';
import { useI18n } from '@/i18n';
import { useAuth } from '@/features/auth/fake-auth';
import type { ProjectType } from '@/types';
import type { Project } from '@/types/spec';

const TYPE_ICONS: Record<string, typeof ImagePlus> = {
  banner: ShoppingBag,
  thumbnail: ImagePlus,
  photo: Camera,
};

const quickCreate: { labelKey: string; hintKey: string; icon: typeof ImagePlus; type: ProjectType; popular?: boolean }[] = [
  { labelKey: 'dashboard.quick_create_social', hintKey: 'dashboard.quick_create_social_hint', icon: ImagePlus, type: 'social_post', popular: true },
  { labelKey: 'dashboard.quick_create_ecom', hintKey: 'dashboard.quick_create_ecom_hint', icon: ShoppingBag, type: 'ecom_banner' },
  { labelKey: 'dashboard.quick_create_photoshoot', hintKey: 'dashboard.quick_create_photoshoot_hint', icon: Camera, type: 'photoshoot' },
];

const Dashboard = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardType, setWizardType] = useState<ProjectType | undefined>();
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    setProjects(listProjects());
  }, [wizardOpen]);

  const handleQuickCreate = (type: ProjectType) => {
    setWizardType(type);
    setWizardOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(listProjects());
  };

  const handleDuplicate = (p: Project) => {
    const dup = createProject(`${p.name} (copy)`, p.spec.format);
    setProjects(listProjects());
    navigate(`/app/projects/${dup.id}`);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const completedCount = mockGenerations.filter(g => g.status === 'completed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 animate-page-fade">
      {/* ── Hero ── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
              Welcome back{firstName !== 'there' ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">Your creative studio awaits.</p>
          </div>

          <Button
            onClick={() => { setWizardType(undefined); setWizardOpen(true); }}
            className="btn-gradient h-11 px-6 text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        </div>

        {/* Compact stat pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { icon: Coins, label: t("dashboard.stat_credits"), value: mockCredits.current },
            { icon: FolderOpen, label: t("dashboard.stat_projects"), value: projects.length },
            { icon: Zap, label: t("dashboard.stat_generations"), value: completedCount },
            { icon: Download, label: t("dashboard.stat_exports"), value: 12 },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 bg-card border border-border/50 rounded-full px-3.5 py-1.5 text-sm animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${i * 60}ms` }}>
              <s.icon className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium tabular-nums">{s.value}</span>
              <span className="text-muted-foreground text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dynamic Grid: Quick Create + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Create (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.quick_create")}</span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickCreate.map((item, i) => (
              <button
                key={item.type}
                onClick={() => handleQuickCreate(item.type)}
                className="relative bg-card border border-border/50 rounded-xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 group animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {item.popular && (
                  <Badge variant="secondary" className="absolute top-3 right-3 text-[9px] px-1.5 py-0 h-4 font-normal opacity-70">
                    Popular
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors duration-200">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm">{t(item.labelKey)}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t(item.hintKey)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Sidebar widgets (1/3) */}
        <div className="space-y-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Production</span>

          <div className="bg-card border border-border/50 rounded-xl p-5 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '120ms' }}>
            <MiniProductionChart />
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}>
            <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{completedCount} completed</p>
              <p className="text-[11px] text-muted-foreground">this week</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Projects ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.recent_projects")}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')} className="text-xs h-7 text-muted-foreground hover:text-foreground">
            {t("common.view_all")}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-14 text-center animate-fade-in">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold text-lg">{t("projects.empty_title")}</p>
            <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-xs mx-auto">Start by creating your first project — it only takes a few seconds.</p>
            <Button onClick={() => { setWizardType(undefined); setWizardOpen(true); }} className="btn-gradient">
              <Plus className="h-4 w-4 mr-1.5" />
              {t("projects.new_project")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 6).map((project, i) => {
              const moduleType = (project as any).spec?.module || '';
              const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;

              return (
                <div
                  key={project.id}
                  className="bg-card border border-border/50 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 group cursor-pointer relative animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${i * 60 + 100}ms` }}
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                >
                  {/* Thumbnail area */}
                  <div className="h-24 rounded-lg bg-muted/40 flex items-center justify-center mb-3 overflow-hidden">
                    <ModuleIcon className="h-7 w-7 text-muted-foreground/40" />
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        {project.spec?.module || 'project'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Hover overlay: Continue + dropdown */}
                  <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-card via-card/95 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between">
                    <Button size="sm" className="h-7 text-xs btn-gradient shadow-md shadow-primary/15" onClick={(e) => { e.stopPropagation(); navigate(`/app/projects/${project.id}`); }}>
                      Continue
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => navigate(`/app/projects/${project.id}`)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> {t("common.open")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} initialType={wizardType} />
    </div>
  );
};

export default Dashboard;
