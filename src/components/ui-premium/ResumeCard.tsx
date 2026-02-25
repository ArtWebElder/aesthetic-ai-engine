import { ArrowRight, FolderOpen, ImagePlus, ShoppingBag, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/spec';

const TYPE_ICONS: Record<string, typeof ImagePlus> = {
  banner: ShoppingBag,
  thumbnail: ImagePlus,
  photo: Camera,
};

interface ResumeCardProps {
  project: Project;
  onContinue: () => void;
}

export function ResumeCard({ project, onContinue }: ResumeCardProps) {
  const moduleType = (project as any).spec?.module || '';
  const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;

  return (
    <button
      onClick={onContinue}
      className="w-full bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 group animate-fade-in"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/[0.06] flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        <ModuleIcon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground mb-0.5">Continue where you left off</p>
        <p className="font-medium text-sm truncate">{project.name}</p>
      </div>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 hidden sm:flex">
        {moduleType || 'project'}
      </Badge>
      <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
        <ArrowRight className="h-4 w-4 text-primary" />
      </div>
    </button>
  );
}
