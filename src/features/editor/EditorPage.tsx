// src/features/editor/EditorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type {
  BuilderSpec,
  Generation,
  Project,
  ProjectSpec,
  ReferenceImage,
  StylePreset,
  ProjectFormat,
} from "@/types/spec";
import { getProject, upsertProject } from "@/features/projects/store";
import { createDefaultSpec, formatToSize } from "@/features/editor/spec-defaults";
import TemplateRenderer from "@/features/editor/TemplateRenderer";
import {
  ACTION_OPTIONS,
  ANGLE_OPTIONS,
  ASSET_HIGHLIGHTS_OPTIONS,
  CONTEXT_PROPS_OPTIONS,
  DEPTH_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  LAYOUT_BASE_OPTIONS,
  LENS_OPTIONS,
  LIGHTING_SETUP_OPTIONS,
  MATERIAL_FEEL_OPTIONS,
  MACRO_STYLE_OPTIONS,
  MOTION_OPTIONS,
  MOOD_OPTIONS,
  SAFE_SPACE_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
  TEMPERATURE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/features/editor/editor-presets";
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

function aspectToSize(aspect: "1:1" | "4:5" | "3:2" | "4:3" | "16:9" | "9:16"): {
  width: number;
  height: number;
  aspectRatio: string;
} {
  switch (aspect) {
    case "1:1":
      return { width: 1280, height: 1280, aspectRatio: "1:1" };
    case "4:5":
      return { width: 1152, height: 1440, aspectRatio: "4:5" };
    case "3:2":
      return { width: 1536, height: 1024, aspectRatio: "3:2" };
    case "4:3":
      return { width: 1536, height: 1152, aspectRatio: "4:3" };
    case "16:9":
      return { width: 1600, height: 900, aspectRatio: "16:9" };
    case "9:16":
      return { width: 900, height: 1600, aspectRatio: "9:16" };
    default:
      return { width: 1536, height: 1024, aspectRatio: "3:2" };
  }
}

function normalizeReferenceImages(
  referenceImages: ReferenceImage[] | undefined,
  legacyReferenceImageUrl: string | null | undefined
): ReferenceImage[] {
  const validRoles: ReferenceImage["role"][] = [
    "style",
    "composition",
    "product",
    "brand",
    "other",
  ];

  const normalized = (referenceImages ?? [])
    .map((entry) => ({
      id: entry?.id || newId(),
      url: entry?.url?.trim() || null,
      role: validRoles.includes(entry?.role) ? entry.role : "style",
      weight: clampSize(Number(entry?.weight ?? 70), 0, 100),
      lockRealism: Boolean(entry?.lockRealism),
      notes: (entry?.notes ?? "").slice(0, 120),
    }))
    .slice(0, 5);

  const legacyUrl = legacyReferenceImageUrl?.trim();
  if (normalized.length === 0 && legacyUrl) {
    normalized.push({
      id: newId(),
      url: legacyUrl,
      role: "style",
      weight: 70,
      lockRealism: false,
      notes: "",
    });
  }

  return normalized;
}

function sanitizeBuilderMulti(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.filter((v): v is string => typeof v === "string").map((v) => v.trim()))
  )
    .filter(Boolean)
    .slice(0, 8);
}

function ensureSpecDefaults(spec: ProjectSpec): ProjectSpec {
  const brand = spec.brand ?? ({} as any);
  const generation = spec.generation ?? ({} as any);
  const builder = spec.builder ?? ({} as BuilderSpec);
  const normalizedPhotoAspect = (spec.photoAspect ?? "3:2") as NonNullable<ProjectSpec["photoAspect"]>;
  const photoshootSize =
    spec.module === "photoshoot" ? aspectToSize(normalizedPhotoAspect) : null;
  const normalizedReferenceImages = normalizeReferenceImages(
    spec.referenceImages,
    spec.referenceImageUrl
  );

  return {
    ...spec,
    photoAspect:
      spec.photoAspect && ["1:1", "4:5", "3:2", "4:3", "16:9", "9:16"].includes(spec.photoAspect)
        ? spec.photoAspect
        : spec.module === "photoshoot"
        ? "3:2"
        : undefined,
    contextText: spec.contextText ?? "",
    subjectText: spec.subjectText ?? "",
    styleText: spec.styleText ?? "",
    cameraText: spec.cameraText ?? "",
    compositionText: spec.compositionText ?? "",
    subjectImageUrl: spec.subjectImageUrl ?? null,
    contextOpen: Boolean(spec.contextOpen),
    lightingText: spec.lightingText ?? "",
    assetsText: spec.assetsText ?? "",
    promptDebug: Boolean(spec.promptDebug),
    builder: {
      intensity: clampSize(Number(builder.intensity ?? 70), 0, 100),
      subjectType: (builder.subjectType ?? "").trim(),
      framing: (builder.framing ?? "").trim(),
      expression: (builder.expression ?? "").trim(),
      action: (builder.action ?? "").trim(),
      lightingSetup: (builder.lightingSetup ?? "").trim(),
      temperature: (builder.temperature ?? "").trim(),
      mood: (builder.mood ?? "").trim(),
      macroStyle: (builder.macroStyle ?? "").trim(),
      visualStyle: sanitizeBuilderMulti(builder.visualStyle),
      assetsHighlights: sanitizeBuilderMulti(builder.assetsHighlights),
      contextProps: sanitizeBuilderMulti(builder.contextProps),
      materialFeel: (builder.materialFeel ?? "").trim(),
      lens: (builder.lens ?? "").trim(),
      depth: (builder.depth ?? "").trim(),
      angle: (builder.angle ?? "").trim(),
      motion: (builder.motion ?? "").trim(),
      advancedOpen: Boolean(builder.advancedOpen),
      layoutBase: (builder.layoutBase ?? "").trim(),
      safeSpace: (builder.safeSpace ?? "").trim(),
      extraDetails: (builder.extraDetails ?? "").slice(0, 140),
    },
    referenceImages: normalizedReferenceImages,
    referenceImageUrl: null,
    brand: {
      ...brand,
      accent: brand.accent ?? "#34d399",
      secondary: brand.secondary ?? "#888888",
      primary: brand.primary ?? "#ffffff",
      paletteMode: brand.paletteMode ?? "mono",
      accent2: brand.accent2 ?? "#888888",
      neutralBg: brand.neutralBg ?? "#0f172a",
      neutralSurface: brand.neutralSurface ?? "#1e293b",
      neutralText: brand.neutralText ?? "#ffffff",
    },
    generation: {
      ...generation,
      realism: clampSize(Number(generation.realism ?? 70), 0, 100),
      ...(photoshootSize
        ? {
            width: photoshootSize.width,
            height: photoshootSize.height,
            aspectRatio: photoshootSize.aspectRatio,
          }
        : {}),
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
  const [subjectPreviewUrl, setSubjectPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (subjectPreviewUrl) {
        URL.revokeObjectURL(subjectPreviewUrl);
      }
    };
  }, [subjectPreviewUrl]);

  // geração ativa (placeholder)
  const active = useMemo(() => {
    if (!project?.generations?.length) return undefined;
    const g =
      project.activeGenerationId
        ? project.generations.find((x) => x.id === project.activeGenerationId)
        : project.generations[0];
    return g ?? project.generations[0];
  }, [project]);

  const safeSpec = useMemo(() => {
    if (!spec) return null;
    return ensureSpecDefaults(spec);
  }, [spec]);

  // compiled prompt placeholder
  const compiled = useMemo(() => {
    if (!safeSpec) return null;
    return compilePrompt(safeSpec);
  }, [safeSpec]);

  const paletteMode = safeSpec?.brand.paletteMode ?? "mono";
  const showSecondary = paletteMode === "duo" || paletteMode === "tri" || paletteMode === "custom";
  const showAccent2 = paletteMode === "tri" || paletteMode === "custom";
  const subjectImageUrl = (safeSpec?.subjectImageUrl ?? "").trim();
  const subjectPreview = subjectPreviewUrl || subjectImageUrl;
  const builder = safeSpec?.builder;
  const visualStyle = builder?.visualStyle ?? [];
  const assetsHighlights = builder?.assetsHighlights ?? [];
  const contextProps = builder?.contextProps ?? [];
  const referenceImages = safeSpec?.referenceImages ?? [];
  const isPhotoshoot = safeSpec?.module === "photoshoot";

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
    if (!safeSpec) return;

    const size =
      safeSpec.module === "photoshoot"
        ? aspectToSize((safeSpec.photoAspect ?? "3:2") as NonNullable<ProjectSpec["photoAspect"]>)
        : formatToSize(fmt);
    persistSpec({
      ...safeSpec,
      format: fmt,
      generation: {
        ...safeSpec.generation,
        width: size.width,
        height: size.height,
        aspectRatio: size.aspectRatio,
      },
    });
  }

  function generateMock() {
    if (!project || !safeSpec) return;

    const generationId = newId();

    const seed = `${project.id}-${generationId}`;
    const { w, h } = getSafeDims(safeSpec);

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

  if (!project || !safeSpec) {
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
                  {safeSpec.module}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {safeSpec.format}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {safeSpec.stylePreset}
                </span>
                <span className="text-xs px-2 py-1 rounded border border-border">
                  {safeSpec.templateId}
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
            {TEMPLATE_REGISTRY.filter((t) => t.module === safeSpec.module).map((t) => {
              const selected = safeSpec.templateId === t.id;

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
                      ...safeSpec,
                      templateId: t.id as any,
                      stylePreset: (t.stylePreset ?? safeSpec.stylePreset) as StylePreset,
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
                    {safeSpec.module} • {String(t.id)}
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
                    aspectRatio: `${safeSpec.generation.width} / ${safeSpec.generation.height}`,
                  }}
                >
                  <div className="w-full h-full">
                    <TemplateRenderer
                      spec={safeSpec}
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
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-sm font-medium">Avatar / Subject Photo</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const objectUrl = URL.createObjectURL(file);
                  setSubjectPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return objectUrl;
                  });

                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : null;
                    persistSpec({
                      ...safeSpec,
                      subjectImageUrl: result,
                    });
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:text-foreground"
              />

              {subjectPreview ? (
                <div className="space-y-2">
                  <img
                    src={subjectPreview}
                    alt="Subject preview"
                    className="h-[72px] w-[72px] rounded-full border border-border object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubjectPreviewUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      persistSpec({
                        ...safeSpec,
                        subjectImageUrl: null,
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Reference Images</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={referenceImages.length >= 5}
                  onClick={() =>
                    persistSpec({
                      ...safeSpec,
                      referenceImages: [
                        ...referenceImages,
                        {
                          id: newId(),
                          url: null,
                          role: "style",
                          weight: 70,
                          lockRealism: false,
                          notes: "",
                        },
                      ],
                    })
                  }
                >
                  Add
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {referenceImages.length}/5 images
              </div>

              {referenceImages.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No reference images yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {referenceImages.map((ref) => (
                    <div key={ref.id} className="rounded-md border border-border p-3 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-[72px] w-[72px] rounded-md border border-border overflow-hidden bg-muted shrink-0">
                          {ref.url ? (
                            <img
                              src={ref.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <Input
                            value={ref.url ?? ""}
                            placeholder="https://... or upload a file"
                            onChange={(e) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? { ...item, url: e.target.value.trim() || null }
                                    : item
                                ),
                              })
                            }
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result =
                                  typeof reader.result === "string" ? reader.result : null;
                                persistSpec({
                                  ...safeSpec,
                                  referenceImages: referenceImages.map((item) =>
                                    item.id === ref.id ? { ...item, url: result } : item
                                  ),
                                });
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Role</label>
                          <Select
                            value={ref.role}
                            onValueChange={(value) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? {
                                        ...item,
                                        role: value as ReferenceImage["role"],
                                      }
                                    : item
                                ),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="style">Style</SelectItem>
                              <SelectItem value="composition">Composition</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="brand">Brand</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-muted-foreground">Weight</label>
                            <span className="text-xs text-muted-foreground">
                              {clampSize(Number(ref.weight ?? 70), 0, 100)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={clampSize(Number(ref.weight ?? 70), 0, 100)}
                            onChange={(e) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? {
                                        ...item,
                                        weight: clampSize(Number(e.target.value), 0, 100),
                                      }
                                    : item
                                ),
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(ref.lockRealism)}
                            onChange={(e) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? { ...item, lockRealism: e.target.checked }
                                    : item
                                ),
                              })
                            }
                          />
                          Lock realism
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            persistSpec({
                              ...safeSpec,
                              referenceImages: referenceImages.filter((item) => item.id !== ref.id),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>

                      <Input
                        type="text"
                        maxLength={120}
                        placeholder="Notes (optional)"
                        value={ref.notes ?? ""}
                        onChange={(e) =>
                          persistSpec({
                            ...safeSpec,
                            referenceImages: referenceImages.map((item) =>
                              item.id === ref.id
                                ? { ...item, notes: e.target.value.slice(0, 120) }
                                : item
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <button
                type="button"
                className="w-full rounded-md border border-border px-3 py-2 text-left text-xs hover:bg-background"
                onClick={() =>
                  persistSpec({
                    ...safeSpec,
                    contextOpen: !Boolean(safeSpec.contextOpen),
                  })
                }
              >
                {isPhotoshoot ? "Shoot notes (optional)" : "Campaign context (optional)"}{" "}
                {safeSpec.contextOpen ? "▼" : "▶"}
              </button>

              {!safeSpec.contextOpen ? (
                <div className="text-xs text-muted-foreground truncate">
                  {safeSpec.contextText?.trim() || "None"}
                </div>
              ) : (
                <Input
                  placeholder={
                    isPhotoshoot
                      ? "e.g. lifestyle gym, editorial portrait, clean studio"
                      : "e.g. Valentine's promo, premium vibe, summer sale"
                  }
                  value={safeSpec.contextText ?? ""}
                  onChange={(e) =>
                    persistSpec({
                      ...safeSpec,
                      contextText: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Builder</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(safeSpec.promptDebug)}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        promptDebug: e.target.checked,
                      })
                    }
                  />
                  Debug prompt
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Intensity</label>
                  <span className="text-xs text-muted-foreground">
                    {clampSize(Number(builder?.intensity ?? 70), 0, 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={clampSize(Number(builder?.intensity ?? 70), 0, 100)}
                  onChange={(e) =>
                    persistSpec({
                      ...safeSpec,
                      builder: {
                        ...builder,
                        intensity: clampSize(Number(e.target.value), 0, 100),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-md border border-border px-3 py-2 text-left text-xs hover:bg-background"
                  onClick={() =>
                    persistSpec({
                      ...safeSpec,
                      builder: { ...builder, advancedOpen: !builder?.advancedOpen },
                    })
                  }
                >
                  Advanced {builder?.advancedOpen ? "▼" : "▶"}
                </button>

                {builder?.advancedOpen ? (
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Lens</label>
                      <Select
                        value={builder?.lens || ""}
                        onValueChange={(value) =>
                          persistSpec({
                            ...safeSpec,
                            builder: { ...builder, lens: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {LENS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Depth</label>
                      <Select
                        value={builder?.depth || ""}
                        onValueChange={(value) =>
                          persistSpec({
                            ...safeSpec,
                            builder: { ...builder, depth: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPTH_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Angle</label>
                      <Select
                        value={builder?.angle || ""}
                        onValueChange={(value) =>
                          persistSpec({
                            ...safeSpec,
                            builder: { ...builder, angle: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {ANGLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Motion</label>
                      <Select
                        value={builder?.motion || ""}
                        onValueChange={(value) =>
                          persistSpec({
                            ...safeSpec,
                            builder: { ...builder, motion: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Subject Type</label>
                  <Select
                    value={builder?.subjectType || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, subjectType: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Framing</label>
                  <Select
                    value={builder?.framing || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, framing: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {FRAMING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expression</label>
                  <Select
                    value={builder?.expression || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, expression: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPRESSION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Action</label>
                  <Select
                    value={builder?.action || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, action: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Lighting Setup</label>
                  <Select
                    value={builder?.lightingSetup || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, lightingSetup: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_SETUP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Temperature</label>
                  <Select
                    value={builder?.temperature || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, temperature: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPERATURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Mood</label>
                  <Select
                    value={builder?.mood || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, mood: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Macro Style</label>
                  <Select
                    value={builder?.macroStyle || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, macroStyle: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {MACRO_STYLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Layout Base</label>
                  <Select
                    value={builder?.layoutBase || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, layoutBase: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_BASE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Safe Space</label>
                  <Select
                    value={builder?.safeSpace || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, safeSpace: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAFE_SPACE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Visual Style</label>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLE_OPTIONS.map((option) => {
                    const active = visualStyle.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          "px-2 py-1 rounded-md border text-xs transition",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-background",
                        ].join(" ")}
                        onClick={() => {
                          const next = active
                            ? visualStyle.filter((v) => v !== option.value)
                            : [...visualStyle, option.value];
                          persistSpec({
                            ...safeSpec,
                            builder: { ...builder, visualStyle: next },
                          });
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Assets / Elements</label>

                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Highlights</div>
                  <div className="flex flex-wrap gap-2">
                    {ASSET_HIGHLIGHTS_OPTIONS.map((option) => {
                      const active = assetsHighlights.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            "px-2 py-1 rounded-md border text-xs transition",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-background",
                          ].join(" ")}
                          onClick={() => {
                            const next = active
                              ? assetsHighlights.filter((v) => v !== option.value)
                              : [...assetsHighlights, option.value];
                            persistSpec({
                              ...safeSpec,
                              builder: {
                                ...builder,
                                assetsHighlights: Array.from(new Set(next)).slice(0, 8),
                              },
                            });
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Context Props</div>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_PROPS_OPTIONS.map((option) => {
                      const active = contextProps.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            "px-2 py-1 rounded-md border text-xs transition",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-background",
                          ].join(" ")}
                          onClick={() => {
                            const next = active
                              ? contextProps.filter((v) => v !== option.value)
                              : [...contextProps, option.value];
                            persistSpec({
                              ...safeSpec,
                              builder: {
                                ...builder,
                                contextProps: Array.from(new Set(next)).slice(0, 8),
                              },
                            });
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Material Feel</label>
                  <Select
                    value={builder?.materialFeel || ""}
                    onValueChange={(value) =>
                      persistSpec({
                        ...safeSpec,
                        builder: { ...builder, materialFeel: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_FEEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Extra Details</label>
                <Input
                  maxLength={140}
                  value={builder?.extraDetails ?? ""}
                  onChange={(e) =>
                    persistSpec({
                      ...safeSpec,
                      builder: { ...builder, extraDetails: e.target.value.slice(0, 140) },
                    })
                  }
                />
              </div>
            </div>

            {/* PALETTE */}
            {!isPhotoshoot ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Palette</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Accent (Primary)</label>
                  <input
                    type="color"
                    value={
                      safeSpec.brand.accent?.startsWith("#")
                        ? safeSpec.brand.accent
                        : "#34d399"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, accent: e.target.value },
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
                      safeSpec.brand.neutralText?.startsWith("#")
                        ? safeSpec.brand.neutralText
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, neutralText: e.target.value },
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
                      ...safeSpec,
                      brand: {
                        ...safeSpec.brand,
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
                        safeSpec.brand.secondary?.startsWith("#")
                          ? safeSpec.brand.secondary
                          : "#888888"
                      }
                      onChange={(e) =>
                        persistSpec({
                          ...safeSpec,
                          brand: { ...safeSpec.brand, secondary: e.target.value },
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
                        safeSpec.brand.accent2?.startsWith("#")
                          ? safeSpec.brand.accent2
                          : "#888888"
                      }
                      onChange={(e) =>
                        persistSpec({
                          ...safeSpec,
                          brand: { ...safeSpec.brand, accent2: e.target.value },
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
                      safeSpec.brand.neutralBg?.startsWith("#")
                        ? safeSpec.brand.neutralBg
                        : "#0f172a"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, neutralBg: e.target.value },
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
                      safeSpec.brand.neutralSurface?.startsWith("#")
                        ? safeSpec.brand.neutralSurface
                        : "#1e293b"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, neutralSurface: e.target.value },
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
                      safeSpec.brand.neutralText?.startsWith("#")
                        ? safeSpec.brand.neutralText
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, neutralText: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>
              </div>
              </div>
            ) : null}

            {/* TYPOGRAPHY */}
            {!isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">Typography</div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Font preset</label>
                  <Select
                    value={safeSpec.brand.fontPreset}
                    onValueChange={(v) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, fontPreset: v as any },
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
            ) : null}

            {/* CONTRAST */}
            {!isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">Contrast</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(safeSpec.brand.autoContrast)}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, autoContrast: e.target.checked },
                      })
                    }
                  />
                  Auto contrast
                </label>
              </div>
            ) : null}

            {/* STYLE PRESET */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Style Preset</div>

              <Select
                value={safeSpec.stylePreset}
                onValueChange={(v) =>
                  persistSpec({
                    ...safeSpec,
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

            {/* PHOTOSHOOT ASPECT */}
            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">Aspect ratio</div>
                <Select
                  value={safeSpec.photoAspect ?? "3:2"}
                  onValueChange={(v) =>
                    {
                      const nextAspect = v as "1:1" | "4:5" | "3:2" | "4:3" | "16:9" | "9:16";
                      const nextSize = aspectToSize(nextAspect);
                      persistSpec({
                        ...safeSpec,
                        photoAspect: nextAspect,
                        generation: {
                          ...safeSpec.generation,
                          width: nextSize.width,
                          height: nextSize.height,
                          aspectRatio: nextSize.aspectRatio,
                        },
                      });
                    }
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:5">4:5</SelectItem>
                    <SelectItem value="3:2">3:2</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* FORMAT */}
            {!isPhotoshoot ? (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">Format</div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_ultrawide_1920x800" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_ultrawide_1920x800")}
                >
                  Desktop
                </Button>

                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_notebook_1366x768" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_notebook_1366x768")}
                >
                  Notebook
                </Button>

                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_mobile_1080x1350" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_mobile_1080x1350")}
                >
                  Mobile
                </Button>

                <Button
                  type="button"
                  variant={safeSpec.format === "ecom_custom" ? "default" : "outline"}
                  onClick={() => applyFormat("ecom_custom")}
                >
                  Custom
                </Button>
              </div>

              {safeSpec.format === "ecom_custom" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Width</label>
                    <Input
                      value={String(safeSpec.generation.width)}
                      onChange={(e) => {
                        const w = Number(e.target.value || 0);
                        persistSpec({
                          ...safeSpec,
                          generation: {
                            ...safeSpec.generation,
                            width: w,
                            aspectRatio: `${w}:${safeSpec.generation.height}`,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Height</label>
                    <Input
                      value={String(safeSpec.generation.height)}
                      onChange={(e) => {
                        const h = Number(e.target.value || 0);
                        persistSpec({
                          ...safeSpec,
                          generation: {
                            ...safeSpec.generation,
                            height: h,
                            aspectRatio: `${safeSpec.generation.width}:${h}`,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}

            {/* CONTENT */}
            {!isPhotoshoot ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Headline</label>
                  <Input
                    value={safeSpec.content.headline}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        content: { ...safeSpec.content, headline: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Subheadline</label>
                  <Input
                    value={safeSpec.content.subheadline}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        content: { ...safeSpec.content, subheadline: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">CTA</label>
                  <Input
                    value={safeSpec.content.ctaText}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        content: { ...safeSpec.content, ctaText: e.target.value },
                      })
                    }
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Realism</label>
                <span className="text-xs text-muted-foreground">
                  {clampSize(Number(safeSpec.generation.realism ?? 70), 0, 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={clampSize(Number(safeSpec.generation.realism ?? 70), 0, 100)}
                onChange={(e) =>
                  persistSpec({
                    ...safeSpec,
                    generation: {
                      ...safeSpec.generation,
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

