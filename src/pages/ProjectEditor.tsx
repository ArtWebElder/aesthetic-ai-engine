console.log("[ProjectEditor] mounted", { id, pathname: window.location.pathname });
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { compilePrompt } from "@/features/engine/prompt-compiler";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export default function ProjectEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!id) return;
    const p = getProject(id);
    if (!p) {
      nav("/app/projects");
      return;
    }
    setProject(clone(p));
  }, [id, nav]);

  const compiled = useMemo(() => {
    if (!project) return null;
    return compilePrompt(project.spec);
  }, [project]);

  function setSpec(next: ProjectSpec) {
    if (!project) return;
    const nextProject: Project = { ...project, spec: next };
    setProject(nextProject);
    upsertProject(nextProject); // autosave localStorage
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const spec = project.spec;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Project</div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded border border-border">
              {spec.module}
            </span>
            <span className="text-xs px-2 py-1 rounded border border-border">
              {spec.format}
            </span>
            <span className="text-xs px-2 py-1 rounded border border-border">
              {spec.stylePreset}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/app/projects")}>
            Back
          </Button>
          <Button onClick={() => alert("Generate Base Image (placeholder)")}>
            Generate Base Image
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-4">
        {/* Preview */}
        <Card className="min-h-[520px] p-4 flex items-center justify-center relative overflow-hidden">
          <div className="text-center space-y-2">
            <div className="text-lg font-medium">Preview (placeholder)</div>
            <div className="text-sm text-muted-foreground">
              Next step: render template in HTML/CSS (true “builder” feel).
            </div>
          </div>
        </Card>

        {/* Inspector */}
        <Card className="p-4 space-y-4">
          <div className="text-sm font-medium">Content</div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Headline</label>
            <Input
              value={spec.content.headline}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: { ...spec.content, headline: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Subheadline</label>
            <Input
              value={spec.content.subheadline}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: { ...spec.content, subheadline: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">CTA</label>
            <Input
              value={spec.content.ctaText}
              onChange={(e) =>
                setSpec({
                  ...spec,
                  content: { ...spec.content, ctaText: e.target.value },
                })
              }
            />
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-sm font-medium">Compiled Prompt (debug)</div>
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
{compiled?.prompt}
            </pre>
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
NEG: {compiled?.negativePrompt}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}