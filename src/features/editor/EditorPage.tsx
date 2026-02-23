// src/features/editor/EditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Project, ProjectSpec, StylePreset, ProjectFormat } from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { createDefaultSpec, formatToSize } from "@/features/editor/spec-defaults";

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
type EditorGeneration = {
  id: string;
  createdAt: string;
  imageUrl?: string;
};

type EditorProject = Project & {
  generations?: EditorGeneration[];
  activeGenerationId?: string;
};

/** Placeholder seguro para compilar mesmo sem TemplateRenderer pronto */
function svgPreviewDataUrl(spec: ProjectSpec) {
  const w = Math.max(320, Number(spec.generation.width) || 1080);
  const h = Math.max(320, Number(spec.generation.height) || 1350);

  const primary = spec.brand.primary || "#ffffff";
  const secondary = spec.brand.secondary || "#0b0f14";
  const accent = spec.brand.accent || "#34d399";

  const headline = (spec.content.headline || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sub = (spec.content.subheadline || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cta = (spec.content.ctaText || "Learn more").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const badge = (spec.content.badgeText || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const price = (spec.content.price || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Layout simples, mas bem responsivo e “bonito o suficiente”
  const pad = Math.round(Math.min(w, h) * 0.06);
  const badgeW = Math.round(w * 0.16);
  const badgeH = Math.round(h * 0.06);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>

    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.max(10, Math.round(Math.min(w, h) * 0.02))}" />
    </filter>
  </defs>

  <!-- BG -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="${secondary}"/>

  <!-- Glow -->
  <circle cx="${Math.round(w * 0.75)}" cy="${Math.round(h * 0.25)}" r="${Math.round(Math.min(w, h) * 0.35)}"
    fill="url(#g)" opacity="0.45" filter="url(#blur)"/>

  <!-- Card area -->
  <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}"
    rx="${Math.round(Math.min(w, h) * 0.04)}" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)"/>

  <!-- Badge -->
  ${badge ? `
  <rect x="${pad + Math.round(pad*0.2)}" y="${pad + Math.round(pad*0.2)}" width="${badgeW}" height="${badgeH}"
    rx="${Math.round(badgeH/2)}" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
  <text x="${pad + Math.round(pad*0.2) + Math.round(badgeW/2)}" y="${pad + Math.round(pad*0.2) + Math.round(badgeH*0.68)}"
    text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h)*0.022)}" fill="${primary}" opacity="0.9">${badge}</text>
  ` : ""}

  <!-- Headline -->
  <text x="${pad + Math.round(pad*0.2)}" y="${Math.round(h * 0.36)}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h) * 0.075)}"
    font-weight="700"
    fill="${primary}">
    ${headline || "Your Next Big Win"}
  </text>

  <!-- Sub -->
  <text x="${pad + Math.round(pad*0.2)}" y="${Math.round(h * 0.44)}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h) * 0.03)}"
    fill="${primary}" opacity="0.75">
    ${sub || "High-performing creatives in minutes."}
  </text>

  <!-- Price (ecom) -->
  ${price ? `
  <text x="${pad + Math.round(pad*0.2)}" y="${Math.round(h * 0.54)}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h) * 0.05)}"
    font-weight="700"
    fill="${primary}" opacity="0.95">
    ${price}
  </text>
  ` : ""}

  <!-- CTA -->
  <rect x="${pad + Math.round(pad*0.2)}" y="${Math.round(h * 0.70)}"
    width="${Math.round(w * 0.34)}" height="${Math.round(h * 0.075)}"
    rx="${Math.round(h * 0.04)}" fill="url(#g)" opacity="0.95"/>
  <text x="${pad + Math.round(pad*0.2) + Math.round(w*0.17)}" y="${Math.round(h * 0.70) + Math.round(h * 0.052)}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h) * 0.032)}"
    font-weight="700"
    fill="#06110b">
    ${cta}
  </text>

  <!-- Bottom hint -->
  <text x="${pad + Math.round(pad*0.2)}" y="${Math.round(h * 0.90)}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
    font-size="${Math.round(Math.min(w, h) * 0.022)}"
    fill="${primary}" opacity="0.35">
    Template: ${String(spec.templateId)} • Style: ${String(spec.stylePreset)}
  </text>
</svg>`.trim();

  // data URL utf8
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
  const url = imageUrl || svgPreviewDataUrl(spec);

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

  const [showGrid, setShowGrid] = useState(false);

  // carrega projeto por ID
  useEffect(() => {
    if (!id) return;
    const p = getProject(id) as EditorProject | undefined;
    setProject(p ?? null);
    setSpec(p?.spec ?? null);
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
    return {
      prompt: `MODULE=${spec.module}\nFORMAT=${spec.format}\nTEMPLATE=${spec.templateId}\nHEADLINE=${spec.content.headline}\nSUB=${spec.content.subheadline}\nCTA=${spec.content.ctaText}`,
      negativePrompt: `low quality, blurry, watermark`,
    };
  }, [spec]);

  function persist(nextProject: EditorProject) {
    setProject(nextProject);
    // upsertProject espera Project (sem generations no tipo), então fazemos cast seguro:
    upsertProject(nextProject as unknown as Project);
  }

  function persistSpec(nextSpec: ProjectSpec) {
    if (!project) return;
    setSpec(nextSpec);

    const nextProject: EditorProject = {
      ...project,
      spec: nextSpec,
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
    if (!project) return;

    const g: EditorGeneration = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      imageUrl: undefined, // depois você pluga a geração real
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
              <div className="relative overflow-hidden rounded-xl border border-border">
                <div
                  className="relative w-full bg-muted/30 flex items-center justify-center"
                  style={{
                    aspectRatio: `${spec.generation.width} / ${spec.generation.height}`,
                  }}
                >
                  <div className="w-full h-full">
                    <TemplateRendererPlaceholder
                      spec={spec}
                      imageUrl={active?.imageUrl}
                      showGrid={showGrid}
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
            {/* BRAND */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Brand</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Accent</label>
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
                      spec.brand.primary?.startsWith("#")
                        ? spec.brand.primary
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      persistSpec({
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
                    spec.format === "ecom_desktop_1920x800" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_desktop_1920x800")}
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