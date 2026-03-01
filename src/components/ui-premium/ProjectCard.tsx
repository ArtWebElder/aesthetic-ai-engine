import { useNavigate } from "react-router-dom";
import { FolderOpen, ImagePlus, ShoppingBag, Camera, MoreHorizontal, Pencil, Trash2, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useI18n } from "@/i18n";
import type { Project } from "@/types/spec";

const TYPE_ICONS: Record<string, typeof ImagePlus> = {
  social_post: ImagePlus,
  ecom_banner: ShoppingBag,
  photoshoot: Camera,
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  social_post: "project_type.social",
  ecom_banner: "project_type.ecom",
  photoshoot: "project_type.photo",
};

interface ProjectCardProps {
  project: Project;
  index?: number;
  onDelete?: (id: string) => void;
  onDuplicate?: (project: Project) => void;
}

export function ProjectCard({ project, index = 0, onDelete, onDuplicate }: ProjectCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const moduleType = project.spec?.module || "";
  const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;
  const typeLabel = TYPE_LABEL_KEYS[moduleType] ? t(TYPE_LABEL_KEYS[moduleType]) : t("common.project");

  // Check for real thumbnail from generations
  const thumbnailUrl = project.generations?.[0]?.imageUrl;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/[0.08] group cursor-pointer relative animate-fade-in opacity-0 [animation-fill-mode:forwards] bg-card shadow-sm shadow-foreground/[0.03] border border-border/30"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/app/projects/${project.id}`)}
    >
      {/* Thumbnail with aspect ratio */}
      <AspectRatio ratio={21 / 9}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted/40 via-muted/20 to-muted/50 flex items-center justify-center">
            <div className="h-11 w-11 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <ModuleIcon className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/[0.04] opacity-0 group-hover:opacity-100 transition-all duration-250 flex items-center justify-center backdrop-blur-[2px]">
          <Button
            size="sm"
            className="h-8 text-xs btn-gradient shadow-lg shadow-primary/20 translate-y-1 group-hover:translate-y-0 transition-transform duration-200"
            onClick={(e) => { e.stopPropagation(); navigate(`/app/projects/${project.id}`); }}
          >
            {t("project_card.continue")}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Type pill — top-left */}
        <div className="absolute top-2.5 left-2.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0 h-[18px] font-medium bg-background/70 backdrop-blur-md border-0 shadow-sm"
          >
            {typeLabel}
          </Badge>
        </div>
      </AspectRatio>

      {/* Info section */}
      <div className="p-3.5 sm:p-3.5 space-y-1.5">
        <p className="font-medium text-sm truncate">{project.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70">{project.spec?.format}</span>
          <span className="text-[10px] text-muted-foreground/70">
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Kebab menu — top-right */}
      <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur-md hover:bg-background/90 shadow-sm">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => navigate(`/app/projects/${project.id}`)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> {t("common.open")}
            </DropdownMenuItem>
            {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(project)}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> {t("project_card.duplicate")}
                </DropdownMenuItem>
              )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> {t("common.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
