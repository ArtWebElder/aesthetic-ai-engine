import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectWizard from "@/components/ProjectWizard";
import { PageHeader } from "@/components/ui-premium/PageHeader";
import { EmptyState } from "@/components/ui-premium/EmptyState";
import { ProjectCard } from "@/components/ui-premium/ProjectCard";
import { listProjects, deleteProject, createProject } from "../features/projects/store";
import { useI18n } from "@/i18n";
import type { Project } from "@/types/spec";

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
            <SelectItem value="ecom_banner">Banner Ad</SelectItem>
            <SelectItem value="social_post">Social Post</SelectItem>
            <SelectItem value="photoshoot">Photoshoot</SelectItem>
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
          {filtered.map((project: any, i: number) => (
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

      <ProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Projects;
