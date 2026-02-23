// src/features/editor/EditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec, StylePreset } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { createDefaultSpec } from "@/features/editor/spec-defaults";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STYLE_PRESETS } from "@/types";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);

  // carrega do storage quando entra / muda id
  useEffect(() => {
    if (!id) return;
    const p = getProject(id);
    setProject(p ?? null);
  }, [id]);

  const styleValue = project?.spec?.stylePreset ?? "";

  function save(nextSpec: ProjectSpec) {
    if (!project) return;
    const next: Project = {
      ...project,
      spec: nextSpec,
    };
    setProject(next);
    upsertProject(next);
  }

  if (!id) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Missing project id.</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-lg font-semibold">Project not found</div>
        <div className="text-sm text-muted-foreground">
          This project id does not exist in local storage.
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/app/projects")}>
            Back to Projects
          </Button>
          <Button
            onClick={() => {
              // fallback: cria um spec default e salva um projeto novo “por cima”
              const fallbackSpec = createDefaultSpec("feed_1080x1350");
              const fake: Project = {
                id,
                name: "Recovered Project",
                status: "draft",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                spec: fallbackSpec,
              };
              upsertProject(fake);
              setProject(fake);
            }}
          >
            Recover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Editing</div>
          <div className="text-xl font-semibold">{project.name}</div>
          <div className="text-xs text-muted-foreground">
            {project.spec.module} • {project.spec.format} • {project.id}
          </div>
        </div>

        <Button variant="secondary" onClick={() => navigate("/app/projects")}>
          Back
        </Button>
      </div>

      {/* ✅ Controles mínimos pra provar que está salvando e mudando */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Headline</div>
          <Input
            value={project.spec.content.headline}
            onChange={(e) =>
              save({
                ...project.spec,
                content: { ...project.spec.content, headline: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Style Preset</div>
          <Select
            value={styleValue}
            onValueChange={(v) =>
              save({
                ...project.spec,
                stylePreset: v as StylePreset,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_PRESETS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Aqui você renderiza seu canvas/editor real */}
      <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
        (Seu editor/canvas entra aqui) <br />
        Agora você já provou que o estado muda e persiste no localStorage.
      </div>
    </div>
  );
}

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
            {TEMPLATE_REGISTRY.filter(t => t.module === spec.module).map((t) => {
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
  <div
    className="relative w-full bg-muted/30 flex items-center justify-center"
    style={{ aspectRatio: `${spec.generation.width} / ${spec.generation.height}` }}
  >
    <div className="w-full h-full">
      <TemplateRenderer
        spec={spec}
        imageUrl={active?.imageUrl}
        showGrid={showGrid}
      />
    </div>
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
            {/* BRAND */}
<div className="space-y-3">
  <div className="text-sm font-medium">Brand</div>

  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">Accent</label>
      <input
        type="color"
        value={spec.brand.accent?.startsWith("#") ? spec.brand.accent : "#34d399"}
        onChange={(e) =>
          setSpec({
            ...spec,
            brand: { ...spec.brand, accent: e.target.value },
          })
        }
        className="h-10 w-full rounded-md border border-border bg-transparent"
      />
    </div>

    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">Text</label>
      <input
        type="color"
        value={spec.brand.primary?.startsWith("#") ? spec.brand.primary : "#ffffff"}
        onChange={(e) =>
          setSpec({
            ...spec,
            brand: { ...spec.brand, primary: e.target.value },
          })
        }
        className="h-10 w-full rounded-md border border-border bg-transparent"
      />
    </div>
  </div>

  <div className="space-y-2">
    <label className="text-xs text-muted-foreground">Font preset</label>
    <Select
      value={spec.brand.fontPreset}
      onValueChange={(v) =>
        setSpec({
          ...spec,
          brand: { ...spec.brand, fontPreset: v as any },
        })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Choose a font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="space_grotesk">Space Grotesk (Display)</SelectItem>
        <SelectItem value="plus_jakarta">Plus Jakarta Sans</SelectItem>
        <SelectItem value="dm_sans">DM Sans</SelectItem>
        <SelectItem value="inter">Inter</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

{/* STYLE (human) */}
<div className="pt-2 border-t border-border space-y-3">
  <div className="text-sm font-medium">Style</div>

  <Select
    value={spec.effects.preset}
    onValueChange={(v) =>
      setSpec({
        ...spec,
        effects: { ...spec.effects, preset: v as any },
      })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Choose a style" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="clean">Minimal</SelectItem>
      <SelectItem value="glass">Premium</SelectItem>
      <SelectItem value="bold">Promo</SelectItem>
      <SelectItem value="neon">Neon</SelectItem>
    </SelectContent>
  </Select>

  <div className="text-xs text-muted-foreground">
    Human style → o sistema ajusta tokens (overlay, CTA, contraste, etc).
  </div>
</div>

{/* FORMAT */}
<div className="pt-2 border-t border-border space-y-3">
  <div className="text-sm font-medium">Format</div>

  <div className="grid grid-cols-2 gap-2">
    <Button
      type="button"
      variant={spec.format === "ecom_ultrawide_1920x800" ? "default" : "outline"}
      onClick={() => applyFormat("ecom_ultrawide_1920x800")}
    >
      Ultra wide
    </Button>

    <Button
      type="button"
      variant={spec.format === "ecom_notebook_1366x768" ? "default" : "outline"}
      onClick={() => applyFormat("ecom_notebook_1366x768")}
    >
      Notebook
    </Button>

    <Button
      type="button"
      variant={spec.format === "ecom_mobile_1080x1350" ? "default" : "outline"}
      onClick={() => applyFormat("ecom_mobile_1080x1350")}
    >
      Mobile
    </Button>

    <Button
      type="button"
      variant={spec.format === "ecom_custom" ? "default" : "outline"}
      onClick={() => applyFormat("ecom_custom")}
    >
      Custom
    </Button>
  </div>

  {spec.format === "ecom_custom" ? (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Width</label>
        <Input
          value={String(spec.generation.width)}
          onChange={(e) =>
            setSpec({
              ...spec,
              generation: {
                ...spec.generation,
                width: Number(e.target.value || 0),
                aspectRatio: `${Number(e.target.value || 0)}:${spec.generation.height}`,
              },
            })
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Height</label>
        <Input
          value={String(spec.generation.height)}
          onChange={(e) =>
            setSpec({
              ...spec,
              generation: {
                ...spec.generation,
                height: Number(e.target.value || 0),
                aspectRatio: `${spec.generation.width}:${Number(e.target.value || 0)}`,
              },
            })
          }
        />
      </div>
    </div>
  ) : null}
</div>

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