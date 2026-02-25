import CanvasPreview from "@/features/auth/editor/CanvasPreview";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec } from "@/types/spec";
import { getProject, upsertProject } from "../features/projects/store"
import { compilePrompt } from "@/features/engine/prompt-compiler";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export default function ProjectEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!id) return;

    const p = getProject(id);

    if (!p) {
      nav("/app/projects");
      return;
    }

    localStorage.setItem("lastOpenedProjectId", id);
    setProject(clone(p));
  }, [id, nav]);

  const compiled = useMemo(() => {
    if (!project) return null;
    return compilePrompt(project.spec);
  }, [project]);

  function setSpec(next: ProjectSpec) {
    if (!project) return;

    const nextProject: Project = {
      ...project,
      spec: next,
    };

    setProject(nextProject);
    upsertProject(nextProject);
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const spec = project.spec;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{t("common.project")}</div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
        </div>

        <Button variant="outline" onClick={() => nav("/app/projects")}>{t("common.back")}</Button>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-6">
        <Card className="min-h-[500px] flex items-center justify-center">
          <div className="text-muted-foreground">{t("common.preview_placeholder")}</div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="text-sm font-medium">{t("content")}</div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">{t("headline")}</label>
            <Input
              value={spec.content.headline}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: {
                    ...spec.content,
                    headline: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">{t("subheadline")}</label>
            <Input
              value={spec.content.subheadline}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: {
                    ...spec.content,
                    subheadline: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">{t("cta")}</label>
            <Input
              value={spec.content.ctaText}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: {
                    ...spec.content,
                    ctaText: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div>{t("common.compiled_prompt")}</div>
            <pre className="whitespace-pre-wrap">
              {compiled?.prompt}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
