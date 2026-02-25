import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import CreateProjectModal from '@/components/CreateProjectModal';
import { mockCredits, mockProjects, mockGenerations } from '@/lib/mocks/data';
import { useI18n } from '@/i18n';

const quickCreate = [
  {
    labelKey: 'dashboard.quick_create_social',
    hintKey: 'dashboard.quick_create_social_hint',
    icon: ImagePlus,
    type: 'social_post' as const,
  },
  {
    labelKey: 'dashboard.quick_create_ecom',
    hintKey: 'dashboard.quick_create_ecom_hint',
    icon: ShoppingBag,
    type: 'ecom_banner' as const,
  },
  {
    labelKey: 'dashboard.quick_create_photoshoot',
    hintKey: 'dashboard.quick_create_photoshoot_hint',
    icon: Camera,
    type: 'photoshoot' as const,
  },
];

const Dashboard = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t("dashboard.stat_credits")} value={mockCredits.current} icon={Coins} subtitle={t("dashboard.stat_monthly_balance")} />
        <StatCard title={t("dashboard.stat_projects")} value={mockProjects.length} icon={FolderOpen} subtitle={t("dashboard.stat_total_created")} />
        <StatCard title={t("dashboard.stat_generations")} value={mockGenerations.filter(g => g.status === 'completed').length} icon={Zap} subtitle={t("dashboard.stat_completed")} />
        <StatCard title={t("dashboard.stat_exports")} value={12} icon={Download} subtitle={t("dashboard.stat_this_month")} />
      </div>

      <div className="h-px bg-border" />

      {/* Quick create */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">{t("dashboard.quick_create")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickCreate.map((item) => (
            <button
              key={item.type}
              onClick={() => setCreateOpen(true)}
              className="bg-card border border-border rounded-lg p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-150">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
              <h3 className="font-medium text-sm">{t(item.labelKey)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t(item.hintKey)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">{t("dashboard.recent_projects")}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')}>
            {t("common.view_all")}
          </Button>
        </div>
        <div className="space-y-2">
          {mockProjects.slice(0, 3).map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              className="w-full bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover-lift text-left"
            >
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{project.type.replace('_', ' ')}</p>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Dashboard;
