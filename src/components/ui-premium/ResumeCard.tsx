import { ArrowRight, FolderOpen, ImagePlus, ShoppingBag, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/spec';

const TYPE_ICONS: Record<string, typeof ImagePlus> = {
  social_post: ImagePlus,
  ecom_banner: ShoppingBag,
  photoshoot: Camera,
};

const TYPE_LABELS: Record<string, string> = {
  social_post: "Social",
  ecom_banner: "E-com",
  photoshoot: "Photo",
};

interface ResumeCardProps {
  project: Project;
  onContinue: () => void;
}

export function ResumeCard({ project, onContinue }: ResumeCardProps) {
  const moduleType = (project as any).spec?.module || '';
  const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;
  const typeLabel = TYPE_LABELS[moduleType] || 'Project';
  const thumbnailUrl = project.generations?.[0]?.imageUrl;

  return (
    <button
      onClick={onContinue}
      className="w-full rounded-xl overflow-hidden flex items-stretch text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/[0.08] group animate-fade-in bg-gradient-to-r from-primary/[0.04] via-card to-card border border-border/30 shadow-sm"
    >
      {/* Thumbnail */}
      <div className="w-20 sm:w-28 shrink-0 relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted/40 via-muted/20 to-muted/50 flex items-center justify-center">
            <ModuleIcon className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground mb-0.5">Continue where you left off</p>
          <p className="font-medium text-sm truncate">{project.name}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] px-2 py-0 h-[18px] font-medium shrink-0 hidden sm:flex">
          {typeLabel}
        </Badge>
        <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
      </div>
    </button>
  );
}
