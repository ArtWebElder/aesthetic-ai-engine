import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus, Sparkles, ArrowRight, TrendingUp, Target } from 'lucide-react';
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
    const dup = createProject(`${p.name} (copy)`, p.spec.format);
    setProjects(listProjects());
    navigate(`/app/projects/${dup.id}`);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const completedCount = mockGenerations.filter(g => g.status === 'completed').length;
  const mostRecentProject = projects.length > 0 ? projects[0] : null;
  const weeklyGoal = 10;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-page-fade">
      {/* ── Hero ── */}
      <PageHeader
        title={`Welcome back${firstName !== 'there' ? `, ${firstName}` : ''}`}
        subtitle="Your creative studio awaits."
        action={
          <Button
            onClick={() => { setWizardType(undefined); setWizardOpen(true); }}
            className="btn-gradient h-11 px-6 text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        }
      />

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

      {/* ── Getting Started ── */}
      <GettingStartedBanner
        hasProjects={projects.length > 0}
        hasGenerations={completedCount > 0}
        onCreateProject={() => { setWizardType(undefined); setWizardOpen(true); }}
      />

      {/* ── Resume Card ── */}
      {mostRecentProject && (
        <ResumeCard
          project={mostRecentProject}
          onContinue={() => navigate(`/app/projects/${mostRecentProject.id}`)}
        />
      )}

      {/* ── Dynamic Grid: Quick Create + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Create (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader label={t("dashboard.quick_create")} />

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
          <SectionHeader label="Production" />

          <div className="bg-card border border-border/50 rounded-xl p-5 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '120ms' }}>
            <MiniProductionChart />
          </div>

          {/* This Week progress widget */}
          <div className="bg-card border border-border/50 rounded-xl p-4 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">This week</p>
                <p className="text-[11px] text-muted-foreground">{completedCount} of {weeklyGoal} goal</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((completedCount / weeklyGoal) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '280ms' }}>
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
            description="Start by creating your first project — it only takes a few seconds."
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
