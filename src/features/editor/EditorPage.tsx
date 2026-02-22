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
const newId = () => crypto.randomUUID();

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [project, setProject] = useState<Project | null>(null);

  // =========================
  // LOAD PROJECT
  // =========================
  useEffect(() => {
    if (!id) return;

    const p = getProject(id);
    if (!p) {
      nav("/app/projects");
      return;
    }

    setProject(deepClone(p));
  }, [id, nav]);

  // =========================
  // COMPILE PROMPT
  // =========================
  const compiled = useMemo(() => {
    if (!project) return null;
    return compilePrompt(project.spec);
  }, [project]);

  // =========================
  // AUTOSAVE
  // =========================
  function setSpec(next: ProjectSpec) {
    if (!project) return;

    const nextProject: Project = { ...project, spec: next };
    setProject(nextProject);
    upsertProject(nextProject);
  }

  // =========================
  // GENERATE MOCK IMAGE
  // =========================
  function generateMock() {
    if (!project || !compiled) return;

    const genId = newId();
    const seed = `${project.id}-${project.spec.templateId}-${Date.now()}`;

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

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const spec = project.spec;

  const active = (project.generations ?? []).find(
    (g) => g.id === project.activeGenerationId
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Project</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/app/projects")}>
            Back
          </Button>

          <Button onClick={generateMock}>
            Generate Base Image
          </Button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid xl:grid-cols-[1fr_420px] gap-4">

        {/* ========================= */}
        {/* CANVAS / PREVIEW */}
        {/* ========================= */}
        <Card className="min-h-[520px] p-4 relative overflow-hidden flex items-center justify-center bg-muted/30">

          {!active?.imageUrl ? (
            <div className="text-center space-y-2">
              <div className="text-lg font-medium">
                Preview (no image yet)
              </div>
              <div className="text-sm text-muted-foreground">
                Click “Generate Base Image” to simulate AI output.
              </div>
            </div>
          ) : (
            <img
              src={active.imageUrl}
              alt="Generated"
              className="max-h-[520px] object-contain rounded-xl shadow-lg"
            />
          )}
        </Card>

        {/* ========================= */}
        {/* INSPECTOR */}
        {/* ========================= */}
        <Card className="p-4 space-y-4">

          <div className="text-sm font-medium">Content</div>

          {/* Headline */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Headline
            </label>
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

          {/* Subheadline */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Subheadline
            </label>
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

          {/* CTA */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              CTA
            </label>
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

          {/* ========================= */}
          {/* HISTORY */}
          {/* ========================= */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="text-sm font-medium">History</div>

            {(project.generations ?? []).length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No generations yet.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(project.generations ?? []).slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="aspect-square rounded-md overflow-hidden border border-border hover:opacity-90"
                    onClick={() => {
                      const nextProject: Project = {
                        ...project,
                        activeGenerationId: g.id,
                      };
                      setProject(nextProject);
                      upsertProject(nextProject);
                    }}
                    title={new Date(g.createdAt).toLocaleString()}
                  >
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================= */}
          {/* DEBUG PROMPT */}
          {/* ========================= */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="text-sm font-medium">
              Compiled Prompt (debug)
            </div>

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