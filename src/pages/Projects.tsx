import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FolderOpen, ImagePlus, ShoppingBag, Camera, MoreHorizontal, Pencil, Trash2, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectWizard from "@/components/ProjectWizard";
import { listProjects, deleteProject, createProject } from "../features/projects/store";
import { useI18n } from "@/i18n";
import type { Project } from "@/types/spec";

const TYPE_ICONS: Record<string, typeof ImagePlus> = {
  banner: ShoppingBag,
  thumbnail: ImagePlus,
  photo: Camera,
};

const Projects = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>(() => listProjects());
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    setProjects(listProjects());
  }, [createOpen]);

  const filtered = useMemo(() => {
    return projects.filter((p: any) => {
      if (typeFilter !== "all" && p.spec?.module !== typeFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, typeFilter, search]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(listProjects());
  };

  const handleDuplicate = (p: Project) => {
    const dup = createProject(`${p.name} (copy)`, p.spec.format);
    setProjects(listProjects());
    navigate(`/app/projects/${dup.id}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-page-fade">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("projects.count", { count: projects.length })}</p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("projects.new_project")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("projects.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("projects.filter_all_types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("projects.filter.all")}</SelectItem>
            <SelectItem value="banner">{t("projects.filter.banner")}</SelectItem>
            <SelectItem value="thumbnail">{t("projects.filter.thumbnail")}</SelectItem>
            <SelectItem value="photo">{t("projects.filter.photo")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold">{t("projects.empty_title")}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t("projects.empty_subtitle")}</p>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              {t("projects.new_project")}
            </Button>
          </div>
        ) : (
          filtered.map((project: any) => {
            const moduleType = project.spec?.module || '';
            const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;

            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover-lift group cursor-pointer"
                onClick={() => navigate(`/app/projects/${project.id}`)}
              >
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <ModuleIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                      {project.spec?.module || 'project'}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{project.spec?.format}</span>
                  </div>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <p className="text-xs text-muted-foreground">{project.spec?.stylePreset}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>

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
          })
        )}
      </div>

      <ProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Projects;
