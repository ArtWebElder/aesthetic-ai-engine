// src/features/editor/EditorPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec, Generation } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { compilePrompt } from "@/features/engine/prompt-compiler";
import { buildMockImageUrl } from "@/features/engine/mock-image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

const nowIso = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const TEMPLATE_CATALOG = [
  { id: "photo_01", name: "Bold Typography", stylePreset: "bold_ads" },
  { id: "photo_02", name: "Product Spotlight", stylePreset: "minimal_clean" },
  { id: "photo_03", name: "Gradient Overlay", stylePreset: "glass" },
  { id: "photo_04", name: "Minimal Card", stylePreset: "minimal_clean" },
  { id: "photo_05", name: "Story Impact", stylePreset: "bold_ads" },
] as const;

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // LOAD PROJECT
  useEffect(() => {
    if (!id) return;
    const p = getProject(id);
    if (!p) {
      nav("/app/projects");
      return;
    }
    setProject(deepClone(p));
  }, [id, nav]);

  // COMPILE PROMPT
  const compiled = useMemo(() => {
    if (!project) return null;
    return compilePrompt(project.spec);
  }, [project]);

  // AUTOSAVE
  function setSpec(next: ProjectSpec) {
    if (!project) return;
    const nextProject: Project = { ...project, spec: next };
    setProject(nextProject);
    upsertProject(nextProject);
  }

  // GENERATE MOCK IMAGE
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
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* TOP HEADER */}
      <div className="px-4 md:px-6 py-4 border-b border-border bg-background/60 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Project</div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                {project.name}
              </h1>
              <div className="hidden md:flex gap-2">
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {spec.module}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {spec.format}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {spec.stylePreset}
                </span>
                  <span className="text-xs px-2 py-1 rounded border border-border">
    {spec.templateId}
  </span>

              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => nav("/app/projects")}>
              Back
            </Button>

            <Button onClick={generateMock}>
              Generate Base Image
            </Button>
          </div>
        </div>
      </div>

      {/* 3-COL LAYOUT */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr_420px]">
        {/* LEFT: TEMPLATES */}
        <div className="hidden lg:flex flex-col min-h-0 border-r border-border bg-background/40">
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground">TEMPLATES</div>
            <div className="text-sm font-medium">Choose a layout</div>
          </div>

          <div className="p-4 space-y-3 overflow-auto">
            {TEMPLATE_CATALOG.map((t) => {
  const selected = spec.templateId === t.id;

  return (
    <button
      key={t.id}
      type="button"
      className={[
        "w-full text-left rounded-lg border bg-background/60 p-3 transition",
        selected
          ? "border-primary ring-1 ring-primary/30 bg-background"
          : "border-border hover:bg-background",
      ].join(" ")}
      onClick={() => {
        setSpec({
          ...spec,
          templateId: t.id,
          stylePreset: t.stylePreset as any,
        });
      }}
    >
      <div className="h-24 rounded-md bg-muted mb-2" />
      <div className="text-sm font-medium flex items-center justify-between">
        <span>{t.name}</span>
        {selected ? (
          <span className="text-[10px] px-2 py-1 rounded border border-primary/40 text-primary">
            Selected
          </span>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground">
        {spec.module} • {t.id}
      </div>
    </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: CANVAS */}
        <div className="min-h-0 flex flex-col">
          <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium">Canvas</div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGrid((v) => !v)}
              >
                {showGrid ? "Hide grid" : "Show grid"}
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto">
            <div className="mx-auto max-w-[920px]">
              <Card className="relative overflow-hidden">
                <div className="relative w-full aspect-[16/10] bg-muted/30 flex items-center justify-center">
                  {/* grid overlay */}
                  {showGrid && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                      }}
                    />
                  )}

                  {!active?.imageUrl ? (
                    <div className="text-center space-y-2">
                      <div className="text-lg font-medium">No image yet</div>
                      <div className="text-sm text-muted-foreground">
                        Click “Generate Base Image” to simulate output.
                      </div>
                    </div>
                  ) : (
                    <img
                      src={active.imageUrl}
                      alt="Generated"
                      className="max-h-[520px] w-auto object-contain rounded-xl shadow-lg"
                    />
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTOR */}
        <div className="min-h-0 border-l border-border bg-background/40">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-medium">Content</div>
            <div className="text-xs text-muted-foreground">
              Edit text fields (autosave).
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-auto h-full">
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

            {/* HISTORY */}
            <div className="pt-2 border-t border-border space-y-2">
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
                          alt=""
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DEBUG */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-sm font-medium">Compiled Prompt (debug)</div>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
{compiled?.prompt}
              </pre>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
NEG: {compiled?.negativePrompt}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="px-4 md:px-6 py-3 border-t border-border bg-background/70 backdrop-blur flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Tip: generate multiple times to fill History.
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => alert("Create Variations (placeholder)")}>
            Create 10 Variations
          </Button>
          <Button variant="outline" onClick={() => alert("Export 2K (placeholder)")}>
            Export 2K
          </Button>
        </div>
      </div>
    </div>
  );
}