import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FolderOpen, ImagePlus, ShoppingBag, Camera, MoreHorizontal, Pencil, Trash2, Copy, ArrowRight } from "lucide-react";
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
import { PageHeader } from "@/components/ui-premium/PageHeader";
import { EmptyState } from "@/components/ui-premium/EmptyState";
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
      <PageHeader
        title={t("projects.title")}
        subtitle={t("projects.count", { count: projects.length })}
        action={
          <Button onClick={() => setCreateOpen(true)} className="btn-gradient h-10 px-5 text-sm font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            {t("projects.new_project")}
          </Button>
        }
      />

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

      {filtered.length === 0 ? (
        <EmptyState
          title={t("projects.empty_title")}
          description={t("projects.empty_subtitle")}
          action={
            <Button onClick={() => setCreateOpen(true)} size="sm" className="btn-gradient">
              <Plus className="h-4 w-4 mr-1.5" />
              {t("projects.new_project")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project: any, i: number) => {
            const moduleType = project.spec?.module || '';
            const ModuleIcon = TYPE_ICONS[moduleType] || FolderOpen;

            return (
              <div
                key={project.id}
                className="bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] hover:border-primary/20 group cursor-pointer relative animate-fade-in opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(`/app/projects/${project.id}`)}
              >
                {/* Thumbnail */}
                <div className="h-28 bg-muted/30 flex items-center justify-center relative">
                  <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <ModuleIcon className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                  <div className="absolute inset-0 bg-foreground/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button size="sm" className="h-7 text-xs btn-gradient shadow-md shadow-primary/15" onClick={(e) => { e.stopPropagation(); navigate(`/app/projects/${project.id}`); }}>
                      Continue
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        {moduleType || 'project'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{project.spec?.format}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Kebab */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-card/80 backdrop-blur-sm hover:bg-card">
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

      <ProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Projects;
