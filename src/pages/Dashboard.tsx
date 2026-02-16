import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, FolderOpen, Zap, Download, ImagePlus, ShoppingBag, Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import AuroraDivider from '@/components/AuroraDivider';
import CreateProjectModal from '@/components/CreateProjectModal';
import { mockCredits, mockProjects, mockGenerations } from '@/lib/mocks/data';

const quickCreate = [
  { label: 'Social Ad', icon: ImagePlus, type: 'social_post' as const },
  { label: 'E-com Banner', icon: ShoppingBag, type: 'ecom_banner' as const },
  { label: 'Photoshoot', icon: Camera, type: 'photoshoot' as const },
];

const Dashboard = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your creative studio.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Credits" value={mockCredits.current} icon={Coins} subtitle="Monthly balance" />
        <StatCard title="Projects" value={mockProjects.length} icon={FolderOpen} subtitle="Total created" />
        <StatCard title="Generations" value={mockGenerations.filter(g => g.status === 'completed').length} icon={Zap} subtitle="Completed" />
        <StatCard title="Exports" value={12} icon={Download} subtitle="This month" />
      </div>

      <AuroraDivider />

      {/* Quick create */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Quick Create</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickCreate.map((item) => (
            <button
              key={item.type}
              onClick={() => setCreateOpen(true)}
              className="glass-surface rounded-lg p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
              <h3 className="font-medium text-sm">{item.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">Create a new {item.label.toLowerCase()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Recent Projects</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')}>
            View all
          </Button>
        </div>
        <div className="space-y-2">
          {mockProjects.slice(0, 3).map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              className="w-full glass-surface rounded-lg p-4 flex items-center gap-4 hover-lift text-left"
            >
              <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
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
