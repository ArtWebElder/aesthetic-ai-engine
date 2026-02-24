import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateProjectModal from "@/components/CreateProjectModal";
import { listProjects } from "../features/projects/store";
import { useI18n } from "@/i18n";

const Projects = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState(() => listProjects());
  const navigate = useNavigate();
  const { t } = useI18n();

  // recarrega quando abrir a página (e quando fechar o modal)
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t("projects.title")}</h1>
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
          <div className="glass-surface rounded-lg p-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("projects.empty")}</p>
          </div>
        ) : (
          filtered.map((project: any) => (
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
                <p className="text-xs text-muted-foreground">
                  {project.spec?.module} · {project.spec?.format}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">{project.spec?.stylePreset}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default Projects;
