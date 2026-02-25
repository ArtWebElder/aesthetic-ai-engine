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
  FINISH_OPTIONS,
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
import {
  PHOTOSHOOT_PRESET_OPTIONS,
  PHOTOSHOOT_PRESETS,
  applyPhotoshootPreset,
} from "@/features/editor/photoshoot-presets";
import type { PhotoshootPresetId } from "@/features/editor/photoshoot-presets";
import { compilePrompt } from "@/features/engine/prompt-compiler";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STYLE_PRESETS } from "@/types";
import { useI18n } from "@/i18n";

/**
 * Seu Project do /types/spec nÃ£o tem "generations" no tipo.
 * Mas seu editor usa isso. EntÃ£o tipamos localmente como opcional,
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
function clampInt(n: number, min: number, max: number): number {
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

function socialPlatformToSize(platformPreset: string): {
  aspectRatio: string;
  width: number;
  height: number;
} {
  switch (platformPreset) {
    case "instagram_story":
      return { aspectRatio: "9:16", width: 1080, height: 1920 };
    case "facebook_landscape":
      return { aspectRatio: "1.91:1", width: 1200, height: 628 };
    case "tiktok_vertical":
      return { aspectRatio: "9:16", width: 1080, height: 1920 };
    case "instagram_feed_4_5":
      return { aspectRatio: "4:5", width: 1080, height: 1350 };
    case "instagram_feed":
    default:
      return { aspectRatio: "1:1", width: 1080, height: 1080 };
  }
}

function buildSocialOverlayDataUrl(lines: string[], color: string): string {
  const safeLines = lines.filter(Boolean).slice(0, 3);
  const escaped = safeLines.map((line) => line.replace(/[<>&"]/g, ""));
  const t1 = escaped[0] ?? "";
  const t2 = escaped[1] ?? "";
  const t3 = escaped[2] ?? "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="transparent"/><text x="70" y="250" fill="${color}" font-family="Arial,sans-serif" font-weight="800" font-size="110">${t1}</text><text x="70" y="390" fill="${color}" font-family="Arial,sans-serif" font-weight="700" font-size="68">${t2}</text><text x="70" y="500" fill="${color}" font-family="Arial,sans-serif" font-weight="700" font-size="58">${t3}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
  const content = spec.content ?? ({} as any);
  const normalizedPhotoAspect = (spec.photoAspect ?? "3:2") as NonNullable<ProjectSpec["photoAspect"]>;
  const isSocialPost = spec.module === "social_post";
  const photoshootSize =
    spec.module === "photoshoot" ? aspectToSize(normalizedPhotoAspect) : null;
  const normalizedReferenceImages = normalizeReferenceImages(
    spec.referenceImages,
    spec.referenceImageUrl
  );

  return {
    ...spec,
    templateId:
      spec.module === "photoshoot"
        ? "photoshoot_clean"
        : spec.module === "social_post"
        ? "social_post_clean"
        : spec.templateId,
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
    content: {
      ...content,
      headline: content.headline ?? "",
      subheadline: content.subheadline ?? "",
      ctaText: content.ctaText ?? "",
    },
    builder: {
      platformPreset: (builder.platformPreset ?? (isSocialPost ? "instagram_feed" : "")).trim(),
      goalPreset: (builder.goalPreset ?? (isSocialPost ? "Offer" : "")).trim(),
      layoutPreset: (builder.layoutPreset ?? (isSocialPost ? "Hero" : "")).trim(),
      headline: (builder.headline ?? "").trim(),
      subheadline: (builder.subheadline ?? "").trim(),
      cta: (builder.cta ?? "").trim(),
      badge: (builder.badge ?? "").trim(),
      brandName: (builder.brandName ?? "").trim(),
      logoUploads: Array.isArray(builder.logoUploads) ? builder.logoUploads.filter(Boolean) : [],
      productUploads: Array.isArray(builder.productUploads)
        ? builder.productUploads.filter(Boolean)
        : [],
      backgroundUploads: Array.isArray(builder.backgroundUploads)
        ? builder.backgroundUploads.filter(Boolean)
        : [],
      premiumOverlayEnabled: Boolean(builder.premiumOverlayEnabled),
      premiumOverlayUrls: Array.isArray(builder.premiumOverlayUrls)
        ? builder.premiumOverlayUrls.filter(Boolean)
        : [],
      designerMode: Boolean(builder.designerMode),
      batchCount: clampInt(
        Number(builder.batchCount ?? (spec.module === "photoshoot" ? 4 : 1)),
        1,
        8
      ),
      intensity: clampSize(Number(builder.intensity ?? 70), 0, 100),
      finish:
        spec.module === "photoshoot"
          ? (builder.finish ?? "").trim() || "true_to_life"
          : (builder.finish ?? "").trim(),
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
      // Harden legacy specs: lock motion to static in photoshoot mode.
      motion: spec.module === "photoshoot" ? "static" : (builder.motion ?? "").trim(),
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
      ...(isSocialPost
        ? socialPlatformToSize((builder.platformPreset ?? "instagram_feed").trim())
        : {}),
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
 * Quando vocÃª plugar o sistema real, sÃ³ substitui por seu TEMPLATE_REGISTRY real.
 */
const TEMPLATE_REGISTRY: Array<{
  id: ProjectSpec["templateId"] | string;
  nameKey: string;
  module: ProjectSpec["module"];
  stylePreset?: StylePreset;
}> = [
  { id: "social_post_clean", nameKey: "editor.template_name.social_post_clean", module: "social_post", stylePreset: "clean_modern" },
  { id: "social_01", nameKey: "editor.template_name.social_01", module: "social", stylePreset: "bold_ads" },
  { id: "ecom_01", nameKey: "editor.template_name.ecom_01", module: "ecom", stylePreset: "minimal_clean" },
  { id: "photoshoot_clean", nameKey: "editor.template_name.photoshoot_clean", module: "photoshoot", stylePreset: "editorial" },
];

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { t } = useI18n();

  const [project, setProject] = useState<EditorProject | null>(null);
  const [spec, setSpec] = useState<ProjectSpec | null>(null);
  const [subjectPreviewUrl, setSubjectPreviewUrl] = useState<string | null>(null);
  const [photoshootPreset, setPhotoshootPreset] = useState<PhotoshootPresetId>("studio_product");

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

  useEffect(() => {
    if (spec?.module !== "photoshoot") return;
    const builder = spec.builder;
    if (!builder) {
      setPhotoshootPreset("studio_product");
      return;
    }

    const keys: Array<
      "lens" | "depth" | "angle" | "lightingSetup" | "mood" | "temperature" | "finish"
    > = ["lens", "depth", "angle", "lightingSetup", "mood", "temperature", "finish"];

    let matchedPresetId: PhotoshootPresetId | null = null;
    let bestScore = 0;

    (Object.keys(PHOTOSHOOT_PRESETS) as PhotoshootPresetId[]).forEach((presetId) => {
      const preset = PHOTOSHOOT_PRESETS[presetId];
      let score = 0;
      keys.forEach((key) => {
        const presetValue = typeof preset?.[key] === "string" ? preset[key] : "";
        const builderValue = typeof builder?.[key] === "string" ? builder[key] : "";
        if (presetValue && builderValue && presetValue === builderValue) {
          score += 1;
        }
      });
      if (score >= 5 && score > bestScore) {
        bestScore = score;
        matchedPresetId = presetId;
      }
    });

    setPhotoshootPreset(matchedPresetId ?? "studio_product");
  }, [spec?.module, project?.id]);

  // geraÃ§Ã£o ativa (placeholder)
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
  const content = safeSpec?.content ?? { headline: "", subheadline: "", ctaText: "" };
  const visualStyle = builder?.visualStyle ?? [];
  const assetsHighlights = builder?.assetsHighlights ?? [];
  const contextProps = builder?.contextProps ?? [];
  const referenceImages = safeSpec?.referenceImages ?? [];
  const isPhotoshoot = safeSpec?.module === "photoshoot";
  const isSocialPost = safeSpec?.module === "social_post";
  const photoshootSubjectTypeOptions = [
    { value: "person", label: "Person", labelKey: "photoshoot.subject_type.person" },
    { value: "product", label: "Product", labelKey: "photoshoot.subject_type.product" },
    { value: "food", label: "Food", labelKey: "photoshoot.subject_type.food" },
    { value: "pet", label: "Pet", labelKey: "photoshoot.subject_type.pet" },
  ];
  const socialPlatformOptions = [
    { value: "instagram_feed", labelKey: "social.platform.instagram_feed" },
    { value: "instagram_feed_4_5", labelKey: "social.platform.instagram_feed_4_5" },
    { value: "instagram_story", labelKey: "social.platform.instagram_story" },
    { value: "facebook_landscape", labelKey: "social.platform.facebook_landscape" },
    { value: "tiktok_vertical", labelKey: "social.platform.tiktok_vertical" },
  ];
  const socialGoalOptions = [
    { value: "Offer", labelKey: "social.goal.offer" },
    { value: "Announcement", labelKey: "social.goal.announcement" },
    { value: "Testimonial", labelKey: "social.goal.testimonial" },
    { value: "Product highlight", labelKey: "social.goal.product_highlight" },
    { value: "Brand story", labelKey: "social.goal.brand_story" },
    { value: "Educational tip", labelKey: "social.goal.educational_tip" },
  ];
  const socialLayoutOptions = [
    { value: "Hero", labelKey: "social.layout.hero" },
    { value: "Split", labelKey: "social.layout.split" },
    { value: "Overlay text bottom", labelKey: "social.layout.overlay_text_bottom" },
    { value: "Minimal grid", labelKey: "social.layout.minimal_grid" },
    { value: "Brutalist", labelKey: "social.layout.brutalist" },
    { value: "Glass", labelKey: "social.layout.glass" },
  ];
  const socialVisualStyleOptions = [
    { value: "Clean modern", labelKey: "social.style.clean_modern" },
    { value: "Brutalist bold", labelKey: "social.style.brutalist_bold" },
    { value: "Glass pro", labelKey: "social.style.glass_pro" },
    { value: "Neon", labelKey: "social.style.neon" },
    { value: "Editorial", labelKey: "social.style.editorial" },
    { value: "Tech dark", labelKey: "social.style.tech_dark" },
  ];

  const bgUrl = active?.imageUrl ?? null;

  function persistPhotoshootBuilderPatch(patch: Partial<ProjectSpec["builder"]>) {
    if (!safeSpec || !isPhotoshoot) return;
    persistSpec({
      ...safeSpec,
      builder: {
        ...(safeSpec.builder ?? {}),
        ...patch,
        motion: "static",
      },
    });
  }

  function persistSocialPostBuilderPatch(patch: Partial<ProjectSpec["builder"]>) {
    if (!safeSpec || !isSocialPost) return;
    persistSpec({
      ...safeSpec,
      builder: {
        ...(safeSpec.builder ?? {}),
        ...patch,
      },
    });
  }

  function persist(nextProject: EditorProject) {
    setProject(nextProject);
    // upsertProject espera Project (sem generations no tipo), entÃ£o fazemos cast seguro:
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

    const { w, h } = getSafeDims(safeSpec);
    const compiledNow = compilePrompt(safeSpec);
    const count = clampInt(
      Number(
        safeSpec.module === "photoshoot"
          ? safeSpec.builder?.batchCount ?? 4
          : 1
      ),
      1,
      8
    );
    const baseSeed = Math.floor(Math.random() * 1_000_000_000);
    const generated: Generation[] = [];
    for (let i = 0; i < count; i += 1) {
      const generationId = newId();
      const seed = `${project.id}-${baseSeed + i}`;
      generated.push({
        id: generationId,
        projectId: project.id,
        status: "done",
        createdAt: new Date().toISOString(),
        imageUrl: buildPicsumUrl(seed, w, h),
        prompt: compiledNow.prompt,
        negativePrompt: compiledNow.negativePrompt,
      });
    }

    const nextProject: EditorProject = {
      ...project,
      generations: [...generated, ...(project.generations ?? [])],
      activeGenerationId: generated[0]?.id ?? project.activeGenerationId,
    };

    persist(nextProject);
  }

  function createVariations() {
    generateMock();
  }

  function export2K() {
    console.log("activeGenerationId:", project?.activeGenerationId ?? null);
    console.log("generationWidth:", safeSpec?.generation?.width ?? null);
    console.log("generationHeight:", safeSpec?.generation?.height ?? null);
  }

  // estados bÃ¡sicos
  if (!id) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">{t("editor.state.missing_project_id")}</div>
      </div>
    );
  }

  if (!project || !safeSpec) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-lg font-semibold">{t("editor.state.project_not_found")}</div>
        <div className="text-sm text-muted-foreground">
          {t("editor.state.project_not_found_detail")}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => nav("/app/projects")}>
            {t("editor.state.back_to_projects")}
          </Button>
          <Button
            onClick={() => {
              const fallbackSpec = createDefaultSpec("feed_1080x1350");
              const fake: EditorProject = {
                id,
                name: t("editor.state.recovered_project_name"),
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
            {t("editor.state.recover")}
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
            <div className="text-xs text-muted-foreground">{t("editor.header.project")}</div>
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
              {t("editor.header.back")}
            </Button>

            <Button onClick={generateMock}>{t("editor.header.generate_base_image")}</Button>
          </div>
        </div>
      </div>

      {/* 3-COL LAYOUT */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr_420px]">
        {/* LEFT: TEMPLATES */}
        <div className="hidden lg:flex flex-col min-h-0 border-r border-border bg-background/40">
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground">{t("editor.templates.title")}</div>
            <div className="text-sm font-medium">{t("editor.templates.choose_layout")}</div>
          </div>

          <div className="p-4 space-y-3 overflow-auto">
            {TEMPLATE_REGISTRY.filter((t) => t.module === safeSpec.module).map((tpl) => {
              const selected = safeSpec.templateId === tpl.id;

              return (
                <button
                  key={tpl.id}
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
                      templateId: tpl.id as any,
                      stylePreset: (tpl.stylePreset ?? safeSpec.stylePreset) as StylePreset,
                    });
                  }}
                >
                  <div className="h-24 rounded-md bg-muted mb-2" />
                  <div className="text-sm font-medium flex items-center justify-between">
                    <span>{t(tpl.nameKey)}</span>
                    {selected ? (
                      <span className="text-[10px] px-2 py-1 rounded border border-primary/40 text-primary">
                        {t("editor.templates.selected")}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {safeSpec.module} • {String(tpl.id)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: CANVAS */}
        <div className="min-h-0 flex flex-col">
          <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium">{t("editor.canvas.title")}</div>
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
                    {isSocialPost ? (
                      <div className="relative h-full w-full overflow-hidden rounded-xl">
                        {(safeSpec.builder.backgroundUploads?.[0] || bgUrl) ? (
                          <img
                            src={safeSpec.builder.backgroundUploads?.[0] || bgUrl || ""}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-700" />
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                        {safeSpec.builder.logoUploads?.[0] ? (
                          <img
                            src={safeSpec.builder.logoUploads[0]}
                            alt=""
                            className="absolute top-6 left-6 h-16 w-auto object-contain"
                          />
                        ) : null}
                        {safeSpec.builder.productUploads?.[0] ? (
                          <img
                            src={safeSpec.builder.productUploads[0]}
                            alt=""
                            className="absolute right-6 bottom-6 h-[45%] w-auto object-contain"
                          />
                        ) : null}
                        <div className="absolute left-6 right-6 bottom-8">
                          <div className="text-white text-4xl font-bold leading-tight">
                            {safeSpec.builder.headline || content.headline}
                          </div>
                          <div className="text-white/90 text-lg mt-2">
                            {safeSpec.builder.subheadline || content.subheadline}
                          </div>
                          <div className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-medium bg-white/90 text-black">
                            {safeSpec.builder.cta || content.ctaText}
                          </div>
                        </div>
                        {safeSpec.builder.premiumOverlayUrls?.[0] ? (
                          <img
                            src={safeSpec.builder.premiumOverlayUrls[0]}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <TemplateRenderer
                        spec={safeSpec}
                        imageUrl={bgUrl}
                        showGrid={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTOR */}
        <div className="min-h-0 border-l border-border bg-background/40">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-medium">{t("editor.inspector.title")}</div>
            <div className="text-xs text-muted-foreground">
              {t("editor.inspector.edit_text_fields_autosave")}
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-auto h-full">
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-sm font-medium">{t("editor.subject.avatar_photo")}</div>
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
                    alt={t("editor.subject.preview_alt")}
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
                    {t("editor.subject.remove")}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t("editor.references.title")}</div>
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
                  {t("editor.references.add")}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {referenceImages.length}/5 {t("editor.references.images_suffix")}
              </div>

              {referenceImages.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  {t("editor.references.empty")}
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
                            placeholder={t("editor.references.url_or_upload_placeholder")}
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
                          <label className="text-xs text-muted-foreground">{t("editor.references.role")}</label>
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
                              <SelectValue placeholder={t("editor.references.role")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="style">{t("editor.references.role_style")}</SelectItem>
                              <SelectItem value="composition">{t("editor.references.role_composition")}</SelectItem>
                              <SelectItem value="product">{t("editor.references.role_product")}</SelectItem>
                              <SelectItem value="brand">{t("editor.references.role_brand")}</SelectItem>
                              <SelectItem value="other">{t("editor.references.role_other")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-muted-foreground">{t("editor.references.weight")}</label>
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
                          {t("editor.references.lock_realism")}
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
                          {t("editor.references.remove")}
                        </Button>
                      </div>

                      <Input
                        type="text"
                        maxLength={120}
                        placeholder={t("editor.references.notes_optional")}
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

            {isPhotoshoot ? (
              <div className="pt-1 space-y-2">
                <label className="text-xs text-muted-foreground">{t("photoshoot.shoot_type.label")}</label>
                <Select
                  value={photoshootPreset}
                  onValueChange={(value) => {
                    const newId = value as PhotoshootPresetId;
                    setPhotoshootPreset(newId);
                    const next = applyPhotoshootPreset(safeSpec, newId);
                    const nextClosed: ProjectSpec = {
                      ...next,
                      builder: { ...(next.builder ?? {}), advancedOpen: false },
                    };
                    persistSpec(nextClosed);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("photoshoot.shoot_type.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTOSHOOT_PRESET_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("social.platform_preset")}</div>
                <Select
                  value={safeSpec.builder.platformPreset ?? "instagram_feed"}
                  onValueChange={(value) => {
                    const size = socialPlatformToSize(value);
                    persistSpec({
                      ...safeSpec,
                      builder: { ...(safeSpec.builder ?? {}), platformPreset: value },
                      generation: {
                        ...safeSpec.generation,
                        width: size.width,
                        height: size.height,
                        aspectRatio: size.aspectRatio,
                      },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("social.choose_platform")} />
                  </SelectTrigger>
                  <SelectContent>
                    {socialPlatformOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("social.goal_use_case")}</div>
                <Select
                  value={safeSpec.builder.goalPreset ?? "Offer"}
                  onValueChange={(value) => persistSocialPostBuilderPatch({ goalPreset: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("social.choose_goal")} />
                  </SelectTrigger>
                  <SelectContent>
                    {socialGoalOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("content")}</div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("headline")}</label>
                  <Input
                    value={safeSpec.builder.headline ?? ""}
                    onChange={(e) =>
                      persistSocialPostBuilderPatch({ headline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("subheadline")}</label>
                  <Input
                    value={safeSpec.builder.subheadline ?? ""}
                    onChange={(e) =>
                      persistSocialPostBuilderPatch({ subheadline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("cta")}</label>
                  <Input
                    value={safeSpec.builder.cta ?? ""}
                    onChange={(e) => persistSocialPostBuilderPatch({ cta: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("brand_name")}</label>
                  <Input
                    value={safeSpec.builder.brandName ?? ""}
                    onChange={(e) =>
                      persistSocialPostBuilderPatch({ brandName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("logo_upload")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = typeof reader.result === "string" ? reader.result : "";
                        if (!url) return;
                        persistSocialPostBuilderPatch({ logoUploads: [url] });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("product_upload")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = typeof reader.result === "string" ? reader.result : "";
                        if (!url) return;
                        persistSocialPostBuilderPatch({ productUploads: [url] });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {t("background_upload_optional")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = typeof reader.result === "string" ? reader.result : "";
                        if (!url) return;
                        persistSocialPostBuilderPatch({ backgroundUploads: [url] });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("social.layout_preset")}</div>
                <Select
                  value={safeSpec.builder.layoutPreset ?? "Hero"}
                  onValueChange={(value) => persistSocialPostBuilderPatch({ layoutPreset: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("social.choose_layout")} />
                  </SelectTrigger>
                  <SelectContent>
                    {socialLayoutOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("social.visual_style")}</div>
                <Select
                  value={safeSpec.builder.macroStyle ?? "clean_modern"}
                  onValueChange={(value) => persistSocialPostBuilderPatch({ macroStyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("social.choose_style")} />
                  </SelectTrigger>
                  <SelectContent>
                    {socialVisualStyleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("accent_color")}</label>
                  <input
                    type="color"
                    value={safeSpec.brand.accent?.startsWith("#") ? safeSpec.brand.accent : "#34d399"}
                    onChange={(e) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, accent: e.target.value },
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-transparent"
                  />
                </div>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("social.premium_effects")}</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(safeSpec.builder.premiumOverlayEnabled)}
                    onChange={(e) =>
                      persistSocialPostBuilderPatch({ premiumOverlayEnabled: e.target.checked })
                    }
                  />
                  {t("social.enable_3d_overlay")}
                </label>
                {safeSpec.builder.premiumOverlayEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const lines = [
                        safeSpec.builder.headline || content.headline,
                        safeSpec.builder.subheadline || content.subheadline,
                        safeSpec.builder.cta || content.ctaText,
                      ];
                      const overlay = buildSocialOverlayDataUrl(
                        lines,
                        safeSpec.brand.accent || "#ffffff"
                      );
                      persistSocialPostBuilderPatch({ premiumOverlayUrls: [overlay] });
                    }}
                >
                    {t("social.generate_overlay_assets")}
                  </Button>
                ) : null}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(safeSpec.builder.designerMode)}
                    onChange={(e) =>
                      persistSocialPostBuilderPatch({ designerMode: e.target.checked })
                    }
                  />
                  {t("social.designer_mode")}
                </label>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-xs text-muted-foreground">{t("images_to_generate")}</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      persistPhotoshootBuilderPatch({
                        batchCount: clampInt(
                          Number((safeSpec.builder?.batchCount ?? 4) - 1),
                          1,
                          8
                        ),
                      })
                    }
                  >
                    -
                  </Button>
                  <div className="text-sm min-w-[2ch] text-center">
                    {clampInt(Number(safeSpec.builder?.batchCount ?? 4), 1, 8)}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      persistPhotoshootBuilderPatch({
                        batchCount: clampInt(
                          Number((safeSpec.builder?.batchCount ?? 4) + 1),
                          1,
                          8
                        ),
                      })
                    }
                  >
                    +
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("consistency_hint")}
                </div>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.subject.heading")}</div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.subject.type")}</label>
                  <Select
                    value={safeSpec.builder.subjectType ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ subjectType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {photoshootSubjectTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.subject.details")}</label>
                  <Textarea
                    rows={2}
                    value={safeSpec.builder.extraDetails ?? ""}
                    onChange={(e) => persistPhotoshootBuilderPatch({ extraDetails: e.target.value })}
                  />
                </div>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.camera_lens.heading")}</div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.camera_lens.lens")}</label>
                  <Select
                    value={safeSpec.builder.lens ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ lens: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LENS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.camera_lens.depth")}</label>
                  <Select
                    value={safeSpec.builder.depth ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ depth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.camera_lens.angle")}</label>
                  <Select
                    value={safeSpec.builder.angle ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ angle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ANGLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.light.heading")}</div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.light.lighting_setup")}</label>
                  <Select
                    value={safeSpec.builder.lightingSetup ?? ""}
                    onValueChange={(value) =>
                      persistPhotoshootBuilderPatch({ lightingSetup: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_SETUP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.light.mood")}</label>
                  <Select
                    value={safeSpec.builder.mood ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ mood: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.light.temperature")}</label>
                  <Select
                    value={safeSpec.builder.temperature ?? ""}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ temperature: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPERATURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.scene_props.heading")}</div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.scene_props.assets_highlights")}</label>
                  <Input
                    value={(safeSpec.builder.assetsHighlights ?? []).join(", ")}
                    onChange={(e) =>
                      persistPhotoshootBuilderPatch({
                        assetsHighlights: e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.scene_props.context_props")}</label>
                  <Input
                    value={(safeSpec.builder.contextProps ?? []).join(", ")}
                    onChange={(e) =>
                      persistPhotoshootBuilderPatch({
                        contextProps: e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.finish.heading")}</div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("photoshoot.finish.label")}</label>
                  <Select
                    value={safeSpec.builder.finish ?? "true_to_life"}
                    onValueChange={(value) => persistPhotoshootBuilderPatch({ finish: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {FINISH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

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
                {isPhotoshoot ? t("photoshoot.notes.optional") : t("editor.context.campaign_optional")}{" "}
                {safeSpec.contextOpen ? "▼" : "▶"}
              </button>

              {!safeSpec.contextOpen ? (
                <div className="text-xs text-muted-foreground truncate">
                  {safeSpec.contextText?.trim() || t("editor.context.none")}
                </div>
              ) : (
                <Input
                  placeholder={
                    isPhotoshoot
                      ? t("photoshoot.notes.placeholder")
                      : t("editor.context.campaign_placeholder")
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
                <div className="text-sm font-medium">{t("editor.builder.title")}</div>
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
                  {t("editor.debug.toggle")}
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.intensity")}</label>
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
                  {t("editor.builder.advanced.label")} {builder?.advancedOpen ? "▼" : "▶"}
                </button>

                {builder?.advancedOpen ? (
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{t("editor.builder.advanced.lens")}</label>
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
                          <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                        </SelectTrigger>
                        <SelectContent>
                          {LENS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{t("editor.builder.advanced.depth")}</label>
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
                          <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPTH_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">{t("editor.builder.advanced.angle")}</label>
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
                          <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                        </SelectTrigger>
                        <SelectContent>
                          {ANGLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!isPhotoshoot && !isSocialPost ? (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">{t("editor.builder.advanced.motion")}</label>
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
                            <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                          </SelectTrigger>
                          <SelectContent>
                            {MOTION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.subject_type")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.framing")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {FRAMING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.expression")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPRESSION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.action")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.lighting_setup")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_SETUP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.temperature")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPERATURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.mood")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.macro_style")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MACRO_STYLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.layout_base")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_BASE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.safe_space")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SAFE_SPACE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("editor.builder.visual_style")}</label>
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
                        {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t("editor.builder.assets_elements")}</label>

                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">{t("editor.builder.highlights")}</div>
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
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">{t("editor.builder.context_props")}</div>
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
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.builder.material_feel")}</label>
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
                      <SelectValue placeholder={t("editor.builder.advanced.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_FEEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {(option.labelKey ? t(option.labelKey) : option.label) || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("editor.builder.extra_details")}</label>
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
            {!isPhotoshoot && !isSocialPost ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">{t("editor.palette.title")}</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">{t("editor.palette.accent_primary")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.palette.text")}</label>
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
                <label className="text-xs text-muted-foreground">{t("editor.palette.mode")}</label>
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
                    <SelectValue placeholder={t("editor.palette.choose_mode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mono">{t("editor.palette.mode_mono")}</SelectItem>
                    <SelectItem value="duo">{t("editor.palette.mode_duo")}</SelectItem>
                    <SelectItem value="tri">{t("editor.palette.mode_tri")}</SelectItem>
                    <SelectItem value="custom">{t("editor.palette.mode_custom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {showSecondary ? (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">{t("editor.palette.secondary")}</label>
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
                    <label className="text-xs text-muted-foreground">{t("editor.palette.accent_2")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.palette.neutral_bg")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.palette.neutral_surface")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.palette.neutral_text")}</label>
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
            {!isPhotoshoot && !isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("editor.typography.title")}</div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">{t("editor.typography.font_preset")}</label>
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
                      <SelectValue placeholder={t("editor.typography.choose_font")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="space_grotesk">{t("editor.typography.font_space_grotesk")}</SelectItem>
                      <SelectItem value="plus_jakarta">{t("editor.typography.font_plus_jakarta")}</SelectItem>
                      <SelectItem value="inter">{t("editor.typography.font_inter")}</SelectItem>
                      <SelectItem value="satoshi">{t("editor.typography.font_satoshi")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {/* CONTRAST */}
            {!isPhotoshoot && !isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("editor.contrast.title")}</div>
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
                  {t("editor.contrast.auto")}
                </label>
              </div>
            ) : null}

            {/* STYLE PRESET */}
            {!isPhotoshoot && !isSocialPost ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("editor.typography.style_preset")}</div>

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
                    <SelectValue placeholder={t("editor.typography.choose_style")} />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_PRESETS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {(s.labelKey ? t(s.labelKey) : s.label) || s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-xs text-muted-foreground">
                  {t("editor.style_preset.helper")}
                </div>
              </div>
            ) : null}


            {/* PHOTOSHOOT ASPECT */}
            {isPhotoshoot ? (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-sm font-medium">{t("photoshoot.aspect_ratio.label")}</div>
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
                    <SelectValue placeholder={t("photoshoot.aspect_ratio.placeholder")} />
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
            {!isPhotoshoot && !isSocialPost ? (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-sm font-medium">{t("editor.format.title")}</div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_ultrawide_1920x800" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_ultrawide_1920x800")}
                >
                  {t("editor.format.desktop")}
                </Button>

                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_notebook_1366x768" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_notebook_1366x768")}
                >
                  {t("editor.format.notebook")}
                </Button>

                <Button
                  type="button"
                  variant={
                    safeSpec.format === "ecom_mobile_1080x1350" ? "default" : "outline"
                  }
                  onClick={() => applyFormat("ecom_mobile_1080x1350")}
                >
                  {t("editor.format.mobile")}
                </Button>

                <Button
                  type="button"
                  variant={safeSpec.format === "ecom_custom" ? "default" : "outline"}
                  onClick={() => applyFormat("ecom_custom")}
                >
                  {t("editor.format.custom")}
                </Button>
              </div>

              {safeSpec.format === "ecom_custom" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">{t("editor.format.width")}</label>
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
                    <label className="text-xs text-muted-foreground">{t("editor.format.height")}</label>
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
            {!isPhotoshoot && !isSocialPost ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">{t("editor.generic.headline")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.generic.subheadline")}</label>
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
                  <label className="text-xs text-muted-foreground">{t("editor.generic.cta")}</label>
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
                <label className="text-xs text-muted-foreground">{t("editor.generic.realism")}</label>
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
              <div className="text-sm font-medium">{t("editor.generic.history")}</div>

              {(project.generations ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  {t("editor.generic.no_generations_yet")}
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
              <div className="text-sm font-medium">{t("editor.debug.compiled_title")}</div>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {compiled?.prompt}
              </pre>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {t("editor.debug.negative_prefix")} {compiled?.negativePrompt}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="px-4 md:px-6 py-3 border-t border-border bg-background/70 backdrop-blur flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {t("editor.actions.tip_generate_history")}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={createVariations}
          >
            {t("editor.actions.create_10_variations")}
          </Button>
          <Button
            variant="outline"
            onClick={export2K}
          >
            {t("editor.actions.export_2k")}
          </Button>
        </div>
      </div>
    </div>
  );
}
