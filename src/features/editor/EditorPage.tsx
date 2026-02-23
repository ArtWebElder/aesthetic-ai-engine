// src/features/editor/EditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Generation, Project, ProjectSpec, StylePreset, ProjectFormat } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { createDefaultSpec, formatToSize } from "@/features/editor/spec-defaults";
import TemplateRenderer from "@/features/editor/TemplateRenderer";
import { compilePrompt } from "@/features/engine/prompt-compiler";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STYLE_PRESETS } from "@/types";

/**
 * Seu Project do /types/spec não tem "generations" no tipo.
 * Mas seu editor usa isso. Então tipamos localmente como opcional,
 * sem quebrar o resto do app.
 */
type EditorProject = Project & {
  generations?: Generation[];
  activeGenerationId?: string;
};

/** Placeholder seguro para compilar mesmo sem TemplateRenderer pronto */
function newId() {
  return crypto.randomUUID();
}

function clampSize(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function getSafeDims(spec: ProjectSpec): { w: number; h: number } {
  const rawW = Number(spec.generation?.width) || 1080;
  const rawH = Number(spec.generation?.height) || 1350;

  return {
    w: clampSize(rawW, 640, 1920),
    h: clampSize(rawH, 640, 1920),
  };
}

function buildPicsumUrl(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function ensureSpecDefaults(spec: ProjectSpec): ProjectSpec {
  return {
    ...spec,
    contextText: spec.contextText ?? "",
    referenceImageUrl: spec.referenceImageUrl ?? null,
    brand: {
      ...spec.brand,
      accent: spec.brand.accent ?? "#34d399",
      secondary: spec.brand.secondary ?? "#888888",
      primary: spec.brand.primary ?? "#ffffff",
      paletteMode: spec.brand.paletteMode ?? "mono",
      accent2: spec.brand.accent2 ?? "#888888",
      neutralBg: spec.brand.neutralBg ?? "#0f172a",
      neutralSurface: spec.brand.neutralSurface ?? "#1e293b",
      neutralText: spec.brand.neutralText ?? "#ffffff",
    },
    generation: {
      ...spec.generation,
      realism: clampSize(Number(spec.generation.realism ?? 70), 0, 100),
    },
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function rand01(seed: number, salt: number): number {
  const x = Math.sin(seed * 0.0001 + salt * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildAbstractSvgDataUrl(seed: string, w: number, h: number): string {
  const base = hashSeed(seed);
  const hueA = Math.floor(rand01(base, 1) * 360);
  const hueB = Math.floor((hueA + 60 + rand01(base, 2) * 120) % 360);
  const hueC = Math.floor((hueA + 180 + rand01(base, 3) * 90) % 360);

  const c1x = Math.floor(w * (0.2 + rand01(base, 4) * 0.6));
  const c1y = Math.floor(h * (0.2 + rand01(base, 5) * 0.6));
  const c2x = Math.floor(w * (0.2 + rand01(base, 6) * 0.6));
  const c2y = Math.floor(h * (0.2 + rand01(base, 7) * 0.6));
  const c3x = Math.floor(w * (0.2 + rand01(base, 8) * 0.6));
  const c3y = Math.floor(h * (0.2 + rand01(base, 9) * 0.6));

  const r1 = Math.floor(Math.min(w, h) * (0.22 + rand01(base, 10) * 0.24));
  const r2 = Math.floor(Math.min(w, h) * (0.20 + rand01(base, 11) * 0.26));
  const r3 = Math.floor(Math.min(w, h) * (0.18 + rand01(base, 12) * 0.28));

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hueA} 42% 16%)" />
      <stop offset="100%" stop-color="hsl(${hueB} 46% 11%)" />
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.max(18, Math.floor(Math.min(w, h) * 0.06))}" />
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)" />
  <circle cx="${c1x}" cy="${c1y}" r="${r1}" fill="hsla(${hueA} 90% 65% / 0.36)" filter="url(#blur)" />
  <circle cx="${c2x}" cy="${c2y}" r="${r2}" fill="hsla(${hueB} 88% 62% / 0.34)" filter="url(#blur)" />
  <circle cx="${c3x}" cy="${c3y}" r="${r3}" fill="hsla(${hueC} 85% 60% / 0.30)" filter="url(#blur)" />
  <rect width="${w}" height="${h}" fill="rgba(255,255,255,0.035)" />
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function TemplateRendererPlaceholder({
  spec,
  imageUrl,
  showGrid,
}: {
  spec: ProjectSpec;
  imageUrl?: string;
  showGrid: boolean;
}) {
  const { w, h } = getSafeDims(spec);
  const seed = `${spec.templateId}-${spec.module}-${w}x${h}`;
  const url = imageUrl || buildAbstractSvgDataUrl(seed, w, h);

  return (
    <div className="w-full h-full relative">
      <img
        src={url}
        alt=""
        className="w-full h-full object-contain"
        draggable={false}
      />

      {showGrid ? (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Registry placeholder (pra compilar).
 * Quando você plugar o sistema real, só substitui por seu TEMPLATE_REGISTRY real.
 */
const TEMPLATE_REGISTRY: Array<{
  id: ProjectSpec["templateId"] | string;
  name: string;
  module: ProjectSpec["module"];
  stylePreset?: StylePreset;
}> = [
  { id: "social_01", name: "Social 01", module: "social", stylePreset: "bold_ads" },
  { id: "ecom_01", name: "Ecom 01", module: "ecom", stylePreset: "minimal_clean" },
  { id: "photo_01", name: "Photo 01", module: "photoshoot", stylePreset: "editorial" },
];

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [project, setProject] = useState<EditorProject | null>(null);
  const [spec, setSpec] = useState<ProjectSpec | null>(null);

  // carrega projeto por ID
  useEffect(() => {
    if (!id) return;
    const p = getProject(id) as EditorProject | undefined;
    if (!p) {
      setProject(null);
      setSpec(null);
      return;
    }
    const normalizedSpec = ensureSpecDefaults(p.spec);
    setProject({ ...p, spec: normalizedSpec });
    setSpec(normalizedSpec);
  }, [id]);

  // geração ativa (placeholder)
  const active = useMemo(() => {
    if (!project?.generations?.length) return undefined;
    const g =
      project.activeGenerationId
        ? project.generations.find((x) => x.id === project.activeGenerationId)
        : project.generations[0];
    return g ?? project.generations[0];
  }, [project]);

  // compiled prompt placeholder
  const compiled = useMemo(() => {
    if (!spec) return null;
    return compilePrompt(ensureSpecDefaults(spec));
  }, [spec]);

  const paletteMode = spec.brand.paletteMode ?? "mono";
  const showSecondary = paletteMode === "duo" || paletteMode === "tri" || paletteMode === "custom";
  const showAccent2 = paletteMode === "tri" || paletteMode === "custom";

  const bgUrl = active?.imageUrl ?? null;

  function persist(nextProject: EditorProject) {
    setProject(nextProject);
    // upsertProject espera Project (sem generations no tipo), então fazemos cast seguro:
    upsertProject(nextProject as unknown as Project);
  }

  function persistSpec(nextSpec: ProjectSpec) {
    if (!project) return;
    const normalizedSpec = ensureSpecDefaults(nextSpec);
    setSpec(normalizedSpec);

    const nextProject: EditorProject = {
      ...project,
      spec: normalizedSpec,
    };

    persist(nextProject);
  }

  function applyFormat(fmt: ProjectFormat) {
    if (!spec) return;

    const size = formatToSize(fmt);
    persistSpec({
      ...spec,
      format: fmt,
      generation: {
        ...spec.generation,
        width: size.width,
        height: size.height,
        aspectRatio: size.aspectRatio,
      },
    });
  }

  function generateMock() {
    if (!project || !spec) return;

    const generationId = newId();

    const seed = `${project.id}-${generationId}`;
    const { w, h } = getSafeDims(spec);

    const g: Generation = {
      id: generationId,
      projectId: project.id,
      status: "done",
      createdAt: new Date().toISOString(),
      imageUrl: buildPicsumUrl(seed, w, h),
    };

    const nextProject: EditorProject = {
      ...project,
      generations: [g, ...(project.generations ?? [])],
      activeGenerationId: g.id,
    };

    persist(nextProject);
  }

  // estados básicos
  if (!id) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Missing project id.</div>
      </div>
    );
  }

  if (!project || !spec) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-lg font-semibold">Project not found</div>
        <div className="text-sm text-muted-foreground">
          This project id does not exist in local storage.
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => nav("/app/projects")}>
            Back to Projects
          </Button>
          <Button
            onClick={() => {
              const fallbackSpec = createDefaultSpec("feed_1080x1350");
              const fake: EditorProject = {
                id,
                name: "Recovered Project",
                status: "draft",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                spec: fallbackSpec,
                generations: [],
              };
              persist(fake);
              setSpec(fake.spec);
            }}
          >
            Recover
          </Button>
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

            <Button onClick={generateMock}>Generate Base Image</Button>
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
            {TEMPLATE_REGISTRY.filter((t) => t.module === spec.module).map((t) => {
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
                    persistSpec({
                      ...spec,
                      templateId: t.id as any,
                      stylePreset: (t.stylePreset ?? spec.stylePreset) as StylePreset,
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
                    {spec.module} • {String(t.id)}
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
          </div>

          <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto">
            <div className="mx-auto max-w-[920px]">
              <div className="relative overflow-hidden rounded-xl border border-border">
                <div
                  className="relative w-full bg-muted/30 flex items-center justify-center"
                  style={{
                    aspectRatio: `${spec.generation.width} / ${spec.generation.height}`,
                  }}
                >
                  <div className="w-full h-full">
                    <TemplateRenderer
                      spec={spec}
                      imageUrl={bgUrl}
                      showGrid={false}
                    />
                  </div>
                </div>
              </div>
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
            {/* PALETTE */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Palette</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Accent (Primary)</label>
                  <input
                    type="color"
                    value={
                      spec.brand.accent?.startsWith("#")
                        ? spec.brand.accent
                        : "#34d399"
                    }
                    onChange={(e) =>
                      persistSpec({
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
                    value={
                      spec.brand.neutralText?.startsWith("#")
                        ? spec.brand.neutralText
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...spec,
                        brand: { ...spec.brand, neutralText: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Palette mode</label>
                <Select
                  value={paletteMode}
                  onValueChange={(v) =>
                    persistSpec({
                      ...spec,
                      brand: {
                        ...spec.brand,
                        paletteMode: v as "mono" | "duo" | "tri" | "custom",
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a palette mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mono">Mono</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="tri">Tri</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {showSecondary ? (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Secondary</label>
                    <input
                      type="color"
                      value={
                        spec.brand.secondary?.startsWith("#")
                          ? spec.brand.secondary
                          : "#888888"
                      }
                      onChange={(e) =>
                        persistSpec({
                          ...spec,
                          brand: { ...spec.brand, secondary: e.target.value },
                        })
                      }
                      className="h-10 w-full rounded-md border border-border bg-transparent"
                    />
                  </div>
                ) : null}

                {showAccent2 ? (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Accent 2</label>
                    <input
                      type="color"
                      value={
                        spec.brand.accent2?.startsWith("#")
                          ? spec.brand.accent2
                          : "#888888"
                      }
                      onChange={(e) =>
                        persistSpec({
                          ...spec,
                          brand: { ...spec.brand, accent2: e.target.value },
                        })
                      }
                      className="h-10 w-full rounded-md border border-border bg-transparent"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Neutral BG</label>
                  <input
                    type="color"
                    value={
                      spec.brand.neutralBg?.startsWith("#")
                        ? spec.brand.neutralBg
                        : "#0f172a"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...spec,
                        brand: { ...spec.brand, neutralBg: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Neutral Surface</label>
                  <input
                    type="color"
                    value={
                      spec.brand.neutralSurface?.startsWith("#")
                        ? spec.brand.neutralSurface
                        : "#1e293b"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...spec,
                        brand: { ...spec.brand, neutralSurface: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Neutral Text</label>
                  <input
                    type="color"
                    value={
                      spec.brand.neutralText?.startsWith("#")
                        ? spec.brand.neutralText
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...spec,
                        brand: { ...spec.brand, neutralText: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* TYPOGRAPHY */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Typography</div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Font preset</label>
                <Select
                  value={spec.brand.fontPreset}
                  onValueChange={(v) =>
                    persistSpec({
                      ...spec,
                      brand: { ...spec.brand, fontPreset: v as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="space_grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="plus_jakarta">Plus Jakarta</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="satoshi">Satoshi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CONTRAST */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Contrast</div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(spec.brand.autoContrast)}
                  onChange={(e) =>
                    persistSpec({
                      ...spec,
                      brand: { ...spec.brand, autoContrast: e.target.checked },
                    })
                  }
                />
                Auto contrast
              </label>
            </div>

            {/* STYLE PRESET */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Style Preset</div>

              <Select
                value={spec.stylePreset}
                onValueChange={(v) =>
                  persistSpec({
                    ...spec,
                    stylePreset: v as StylePreset,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_PRESETS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-muted-foreground">
                (Você pode depois mapear stylePreset → tokens/effects automaticamente.)
              </div>
            </div>

            {/* FORMAT */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Format</div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    spec.format === "ecom_ultrawide_1920x800" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_ultrawide_1920x800")}
                >
                  Desktop
                </Button>

                <Button
                  type="button"
                  variant={
                    spec.format === "ecom_notebook_1366x768" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_notebook_1366x768")}
                >
                  Notebook
                </Button>

                <Button
                  type="button"
                  variant={
                    spec.format === "ecom_mobile_1080x1350" ? "default" : "outline"
                  }
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
                      onChange={(e) => {
                        const w = Number(e.target.value || 0);
                        persistSpec({
                          ...spec,
                          generation: {
                            ...spec.generation,
                            width: w,
                            aspectRatio: `${w}:${spec.generation.height}`,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Height</label>
                    <Input
                      value={String(spec.generation.height)}
                      onChange={(e) => {
                        const h = Number(e.target.value || 0);
                        persistSpec({
                          ...spec,
                          generation: {
                            ...spec.generation,
                            height: h,
                            aspectRatio: `${spec.generation.width}:${h}`,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* CONTENT */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Headline</label>
              <Input
                value={spec.content.headline}
                onChange={(e) =>
                  persistSpec({
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
                  persistSpec({
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
                  persistSpec({
                    ...spec,
                    content: { ...spec.content, ctaText: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Context</label>
              <Input
                value={spec.contextText ?? ""}
                onChange={(e) =>
                  persistSpec({
                    ...spec,
                    contextText: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Reference Image URL</label>
              <Input
                value={spec.referenceImageUrl ?? ""}
                onChange={(e) =>
                  persistSpec({
                    ...spec,
                    referenceImageUrl: e.target.value.trim() ? e.target.value : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Realism</label>
                <span className="text-xs text-muted-foreground">
                  {clampSize(Number(spec.generation.realism ?? 70), 0, 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={clampSize(Number(spec.generation.realism ?? 70), 0, 100)}
                onChange={(e) =>
                  persistSpec({
                    ...spec,
                    generation: {
                      ...spec.generation,
                      realism: clampSize(Number(e.target.value), 0, 100),
                    },
                  })
                }
                className="w-full"
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
                        const nextProject: EditorProject = {
                          ...project,
                          activeGenerationId: g.id,
                        };
                        persist(nextProject);
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
          <Button
            variant="outline"
            onClick={() => alert("Create Variations (placeholder)")}
          >
            Create 10 Variations
          </Button>
          <Button
            variant="outline"
            onClick={() => alert("Export 2K (placeholder)")}
          >
            Export 2K
          </Button>
        </div>
      </div>
    </div>
  );
} 

