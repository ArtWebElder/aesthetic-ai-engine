import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus, Sparkles, MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatCard from '@/components/StatCard';
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

const quickCreate: { labelKey: string; hintKey: string; icon: typeof ImagePlus; type: ProjectType }[] = [
  { labelKey: 'dashboard.quick_create_social', hintKey: 'dashboard.quick_create_social_hint', icon: ImagePlus, type: 'social_post' },
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-page-fade">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            {t("dashboard.title")}{firstName !== 'there' ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Credits pill */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2 text-sm">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{mockCredits.current}</span>
            <span className="text-muted-foreground text-xs">{t("dashboard.stat_credits").toLowerCase()}</span>
          </div>

          <Button onClick={() => { setWizardType(undefined); setWizardOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t("dashboard.stat_credits")} value={mockCredits.current} icon={Coins} subtitle={t("dashboard.stat_monthly_balance")} />
        <StatCard title={t("dashboard.stat_projects")} value={projects.length} icon={FolderOpen} subtitle={t("dashboard.stat_total_created")} />
        <StatCard title={t("dashboard.stat_generations")} value={mockGenerations.filter(g => g.status === 'completed').length} icon={Zap} subtitle={t("dashboard.stat_completed")} />
        <StatCard title={t("dashboard.stat_exports")} value={12} icon={Download} subtitle={t("dashboard.stat_this_month")} />
      </div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.quick_create")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Quick create tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickCreate.map((item) => (
          <button
            key={item.type}
            onClick={() => handleQuickCreate(item.type)}
            className="bg-card border border-border rounded-xl p-5 text-left hover-lift group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-150">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </div>
            <h3 className="font-medium text-sm">{t(item.labelKey)}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t(item.hintKey)}</p>
          </button>
        ))}
      </div>

      {/* Recent projects divider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.recent_projects")}</span>
        <div className="flex-1 h-px bg-border" />
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')} className="text-xs">
          {t("common.view_all")}
        </Button>
      </div>

      {/* Recent projects */}
      {projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center animate-fade-in">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-heading font-semibold">{t("projects.empty_title")}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t("projects.empty_subtitle")}</p>
          <Button onClick={() => { setWizardType(undefined); setWizardOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.slice(0, 5).map((project) => {
            const moduleType = (project as any).spec?.module || '';
            const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;

            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover-lift group cursor-pointer"
                onClick={() => navigate(`/app/projects/${project.id}`)}
              >
                {/* Thumbnail placeholder */}
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <ModuleIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                      {project.spec?.module || 'project'}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{project.spec?.format}</span>
                  </div>
                </div>

                {/* Date */}
                <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => navigate(`/app/projects/${project.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      {t("common.open")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} initialType={wizardType} />
    </div>
  );
};

export default Dashboard;
