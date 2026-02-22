// src/features/editor/EditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec, Generation } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { compilePrompt } from "@/features/engine/prompt-compiler";
import { buildMockImageUrl } from "@/features/engine/mock-image";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

const nowIso = () => new Date().toISOString();

function newId() {
  return crypto.randomUUID();
}

export default function EditorPage() {
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
    setProject(deepClone(p));
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
      <div className="p-8">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const spec = project.spec;

  function generateMock() {
    if (!compiled) return;

    const genId = newId();
    const seed = `${project.id}-${spec.templateId}-${Date.now()}`;
    const imageUrl = buildMockImageUrl(compiled.meta, seed);

    const gen: Generation = {
      id: genId,
      projectId: project.id,
      status: "done",
      imageUrl,
      prompt: compiled.prompt,
      negativePrompt: compiled.negativePrompt,
      createdAt: nowIso(),
    };

    const nextProject: Project = {
      ...project,
      status: "generated",
      generations: [gen, ...(project.generations ?? [])],
      activeGenerationId: genId,
    };

    setProject(nextProject);
    upsertProject(nextProject);
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Project</div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/app/projects")}>
            Back
          </Button>
          <Button onClick={generateMock}>Generate Base Image</Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-4">
        {/* Canvas / Preview */}
        <Card className="min-h-[520px] p-4 relative overflow-hidden">
          {(() => {
            const active = (project.generations ?? []).find(
              (g) => g.id === project.activeGenerationId
            );

            if (!active?.imageUrl) {
              return (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-medium">Preview (placeholder)</div>
                    <div className="text-sm text-muted-foreground">
                      Generate to see a result (mock for now).
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="h-full w-full">
                <img
                  src={active.imageUrl}
                  alt="Generated"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            );
          })()}
        </Card>

        {/* Inspector (simple V1) */}
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

          {/* ✅ PASSO 4 (OPCIONAL): HISTORY */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="text-sm font-medium">History</div>

            {(project.generations ?? []).length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No generations yet. Click “Generate Base Image”.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(project.generations ?? []).slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    className="aspect-square rounded-md overflow-hidden border border-border hover:opacity-90"
                    onClick={() => {
                      const nextProject: Project = { ...project, activeGenerationId: g.id };
                      setProject(nextProject);
                      upsertProject(nextProject);
                    }}
                    type="button"
                    title={new Date(g.createdAt).toLocaleString()}
                  >
                    {g.imageUrl ? (
                      <img src={g.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border space-y-2">
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