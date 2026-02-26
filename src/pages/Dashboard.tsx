import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus, Sparkles, ArrowRight, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MiniProductionChart from '@/components/MiniProductionChart';
import ProjectWizard from '@/components/ProjectWizard';
import { PageHeader } from '@/components/ui-premium/PageHeader';
import { SectionHeader } from '@/components/ui-premium/SectionHeader';
import { EmptyState } from '@/components/ui-premium/EmptyState';
import { GettingStartedBanner } from '@/components/ui-premium/GettingStartedBanner';
import { ResumeCard } from '@/components/ui-premium/ResumeCard';
import { ProjectCard } from '@/components/ui-premium/ProjectCard';
import { mockCredits, mockGenerations } from '@/lib/mocks/data';
import { listProjects, deleteProject, createProject } from '@/features/projects/store';
import { useI18n } from '@/i18n';
import { useAuth } from '@/features/auth/fake-auth';
import type { ProjectType } from '@/types';
import type { Project } from '@/types/spec';

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
    const dup = createProject(`${p.name} ${t("common.copy_suffix")}`, p.spec.format);
    setProjects(listProjects());
    navigate(`/app/projects/${dup.id}`);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const completedCount = mockGenerations.filter(g => g.status === 'completed').length;
  const lastOpenedId = localStorage.getItem("lastOpenedProjectId");
  const mostRecentProject = (lastOpenedId && projects.find(p => p.id === lastOpenedId)) || (projects.length > 0 ? projects[0] : null);
  const weeklyGoal = 10;
  // Streak: count days with activity this week (mock: days with data > 0)
  const activeDays = [3, 5, 2, 7, 4, 6, 8].filter(v => v > 0).length;

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-6xl mx-auto space-y-4 animate-page-fade">
      {/* ── Hero ── */}
      <PageHeader
        title={`${t("dashboard.welcome_back")}${firstName !== 'there' ? `, ${firstName}` : ''}`}
        subtitle={t("dashboard.welcome_subtitle")}
        action={
          <Button
            onClick={() => { setWizardType(undefined); setWizardOpen(true); }}
            className="btn-gradient h-10 px-5 text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        }
      />

      {/* Compact stat pills + streak */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { icon: Coins, label: t("dashboard.stat_credits"), value: mockCredits.current },
          { icon: FolderOpen, label: t("dashboard.stat_projects"), value: projects.length },
          { icon: Zap, label: t("dashboard.stat_generations"), value: completedCount },
          { icon: Download, label: t("dashboard.stat_exports"), value: 12 },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5 bg-card border border-border/30 rounded-full px-2.5 py-1 text-xs animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${i * 60}ms` }}>
            <s.icon className="h-3 w-3 text-primary" />
            <span className="font-medium tabular-nums">{s.value}</span>
            <span className="text-muted-foreground/70 text-[10px]">{s.label}</span>
          </div>
        ))}
        {activeDays > 0 && (
          <div className="flex items-center gap-1.5 bg-card border border-border/30 rounded-full px-2.5 py-1 text-xs animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '300ms' }}>
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-muted-foreground/70 text-[10px]">{t("dashboard.active_days_this_week", { days: activeDays })}</span>
          </div>
        )}
      </div>

      {/* ── Getting Started + Resume — shared row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GettingStartedBanner
          hasProjects={projects.length > 0}
          hasGenerations={completedCount > 0}
          onCreateProject={() => { setWizardType(undefined); setWizardOpen(true); }}
        />
        {mostRecentProject && (
          <ResumeCard
            project={mostRecentProject}
            onContinue={() => navigate(`/app/projects/${mostRecentProject.id}`)}
          />
        )}
      </div>

      {/* ── Quick Create + Production — side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Quick Create (2/3) */}
        <div className="lg:col-span-2 space-y-2">
          <SectionHeader label={t("dashboard.quick_create")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {quickCreate.map((item, i) => (
              <button
                key={item.type}
                onClick={() => handleQuickCreate(item.type)}
                className="relative bg-card border border-border/30 rounded-xl p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 group animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {item.popular && (
                  <Badge variant="secondary" className="absolute top-2.5 right-2.5 text-[9px] px-1.5 py-0 h-4 font-normal opacity-70">
                    {t("dashboard.popular")}
                  </Badge>
                )}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors duration-200">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm">{t(item.labelKey)}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t(item.hintKey)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Production (1/3) */}
        <div className="space-y-2">
          <SectionHeader label={t("dashboard.production")} />
          <div className="bg-card border border-border/30 rounded-xl p-3.5 space-y-2.5 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '120ms' }}>
            <MiniProductionChart />
            <div className="pt-2 border-t border-border/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-medium">{t("dashboard.weekly_goal")}</span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">{completedCount}/{weeklyGoal}</span>
              </div>
              <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((completedCount / weeklyGoal) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Projects ── */}
      <div className="space-y-3">
        <SectionHeader
          label={t("dashboard.recent_projects")}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')} className="text-xs h-7 text-muted-foreground hover:text-foreground">
              {t("common.view_all")}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />

        {projects.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={t("projects.empty_title")}
            description={t("dashboard.empty_description")}
            action={
              <Button onClick={() => { setWizardType(undefined); setWizardOpen(true); }} className="btn-gradient">
                <Plus className="h-4 w-4 mr-1.5" />
                {t("projects.new_project")}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 6).map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} initialType={wizardType} />
    </div>
  );
};

export default Dashboard;
