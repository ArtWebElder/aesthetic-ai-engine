// src/features/editor/EditorPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import type {
  BuilderSpec,
  Generation,
  ModuleType,
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
import {
  SCENE_PRESET_OPTIONS,
  getScenePresetLabelKey,
  normalizeScenePreset,
} from "@/features/editor/scene-presets";
import {
  SCENE_MOOD_OPTIONS,
  getSceneMoodLabelKey,
  normalizeSceneMood,
} from "@/features/editor/scene-moods";
import {
  SCENE_PROP_OPTIONS,
  getScenePropLabelKey,
  normalizeSceneProps,
} from "@/features/editor/scene-props";
import { compilePrompt } from "@/features/engine/prompt-compiler";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { STYLE_PRESETS } from "@/types";
import { useI18n } from "@/i18n";
import { Check, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";

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

function buildSocialOverlayDataUrl(
  lines: string[],
  color: string,
  width: number = 1080,
  height: number = 1080
): string {
  const safeLines = lines.filter(Boolean).slice(0, 3);
  const escaped = safeLines.map((line) => line.replace(/[<>&"]/g, ""));
  const t1 = escaped[0] ?? "";
  const t2 = escaped[1] ?? "";
  const t3 = escaped[2] ?? "";
  const marginX = Math.round(width * 0.06);
  const y1 = Math.round(height * 0.23);
  const y2 = Math.round(height * 0.36);
  const y3 = Math.round(height * 0.46);
  const font1 = Math.round(width * 0.1);
  const font2 = Math.round(width * 0.06);
  const font3 = Math.round(width * 0.05);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="transparent"/><text x="${marginX}" y="${y1}" fill="${color}" font-family="Arial,sans-serif" font-weight="800" font-size="${font1}">${t1}</text><text x="${marginX}" y="${y2}" fill="${color}" font-family="Arial,sans-serif" font-weight="700" font-size="${font2}">${t2}</text><text x="${marginX}" y="${y3}" fill="${color}" font-family="Arial,sans-serif" font-weight="700" font-size="${font3}">${t3}</text></svg>`;
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
  const isEcom = spec.module === "ecom_banner";
  const isPhotoshoot = spec.module === "photoshoot";
  const moduleKey: ModuleType = isPhotoshoot
    ? "photoshoot"
    : isEcom
    ? "ecom_banner"
    : "social_post";
  const photoshootSize = isPhotoshoot ? aspectToSize(normalizedPhotoAspect) : null;
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
      scenePreset: normalizeScenePreset(
        (builder.scenePreset ?? "").trim(),
        moduleKey
      ),
      sceneMood: normalizeSceneMood((builder.sceneMood ?? "").trim(), moduleKey),
      sceneProps: normalizeSceneProps(builder.sceneProps, moduleKey),
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
  { id: "social_01", nameKey: "editor.template_name.social_01", module: "social_post", stylePreset: "bold_ads" },
  { id: "ecom_01", nameKey: "editor.template_name.ecom_01", module: "ecom_banner", stylePreset: "minimal_clean" },
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
  const [isExporting2K, setIsExporting2K] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [lastExportError, setLastExportError] = useState<string | null>(null);
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const panSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const stickToFitRef = useRef(true);
  const [canvasViewport, setCanvasViewport] = useState({ width: 0, height: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasFitScale, setCanvasFitScale] = useState(1);
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);

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
  const isEcom = safeSpec?.module === "ecom_banner";
  const scenePresetModuleKey: ModuleType = isPhotoshoot
    ? "photoshoot"
    : isEcom
    ? "ecom_banner"
    : "social_post";
  const currentScenePreset = normalizeScenePreset(
    safeSpec?.builder?.scenePreset,
    scenePresetModuleKey
  );
  const currentSceneMood = normalizeSceneMood(
    safeSpec?.builder?.sceneMood,
    scenePresetModuleKey
  );
  const currentSceneProps = normalizeSceneProps(
    safeSpec?.builder?.sceneProps,
    scenePresetModuleKey
  );
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
  const previewBaseSize = useMemo(
    () => ({
      width: safeSpec?.generation?.width ?? 1080,
      height: safeSpec?.generation?.height ?? 1350,
    }),
    [safeSpec?.generation?.width, safeSpec?.generation?.height]
  );
  const CANVAS_PADDING = 96;
  const zoomClamp = useCallback((value: number) => Math.max(0.25, Math.min(3, value)), []);
  const computeCanvasGeometry = useCallback(
    (scale: number, viewport = canvasViewport) => {
      const scaledWidth = previewBaseSize.width * scale;
      const scaledHeight = previewBaseSize.height * scale;
      const innerWidth = Math.max(viewport.width, scaledWidth + CANVAS_PADDING * 2);
      const innerHeight = Math.max(viewport.height, scaledHeight + CANVAS_PADDING * 2);
      return {
        innerWidth,
        innerHeight,
        originX: (innerWidth - scaledWidth) / 2,
        originY: (innerHeight - scaledHeight) / 2,
      };
    },
    [canvasViewport, previewBaseSize.height, previewBaseSize.width]
  );
  const centerViewportForScale = useCallback(
    (scale: number) => {
      const container = canvasContainerRef.current;
      if (!container) return;
      const geom = computeCanvasGeometry(scale);
      requestAnimationFrame(() => {
        container.scrollLeft = Math.max(0, (geom.innerWidth - container.clientWidth) / 2);
        container.scrollTop = Math.max(0, (geom.innerHeight - container.clientHeight) / 2);
      });
    },
    [computeCanvasGeometry]
  );
  const computeFitScale = useCallback(() => {
    if (canvasViewport.width <= 0 || canvasViewport.height <= 0) return 1;
    const fit = Math.min(
      Math.max(canvasViewport.width - CANVAS_PADDING * 2, 1) / previewBaseSize.width,
      Math.max(canvasViewport.height - CANVAS_PADDING * 2, 1) / previewBaseSize.height
    );
    return zoomClamp(fit);
  }, [
    CANVAS_PADDING,
    canvasViewport.height,
    canvasViewport.width,
    previewBaseSize.height,
    previewBaseSize.width,
    zoomClamp,
  ]);
  const resetCanvasToFit = useCallback(() => {
    const fit = computeFitScale();
    setCanvasFitScale(fit);
    setCanvasScale(fit);
    centerViewportForScale(fit);
    stickToFitRef.current = true;
  }, [centerViewportForScale, computeFitScale]);
  const zoomToPoint = useCallback(
    (targetScale: number, clientX: number, clientY: number) => {
      const containerEl = canvasContainerRef.current;
      if (!containerEl) return;
      const nextScale = zoomClamp(targetScale);
      if (Math.abs(nextScale - canvasScale) < 0.0001) return;
      const rect = containerEl.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const prevGeom = computeCanvasGeometry(canvasScale);
      const nextGeom = computeCanvasGeometry(nextScale);
      const worldX = (px + containerEl.scrollLeft - prevGeom.originX) / canvasScale;
      const worldY = (py + containerEl.scrollTop - prevGeom.originY) / canvasScale;
      setCanvasScale(nextScale);
      requestAnimationFrame(() => {
        containerEl.scrollLeft = worldX * nextScale + nextGeom.originX - px;
        containerEl.scrollTop = worldY * nextScale + nextGeom.originY - py;
      });
      stickToFitRef.current = false;
    },
    [canvasScale, computeCanvasGeometry, zoomClamp]
  );
  const zoomToViewportCenter = useCallback(
    (targetScale: number) => {
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      zoomToPoint(targetScale, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [zoomToPoint]
  );
  const adjustZoomByStep = useCallback(
    (direction: 1 | -1) => {
      const next = zoomClamp(canvasScale + direction * 0.1);
      zoomToViewportCenter(next);
    },
    [canvasScale, zoomClamp, zoomToViewportCenter]
  );
  const setZoom100 = useCallback(() => {
    zoomToViewportCenter(1);
  }, [zoomToViewportCenter]);
  const handleCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-canvas-zoom-controls='true']")) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    panSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    stickToFitRef.current = false;
    setIsCanvasPanning(true);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  }, []);
  const handleCanvasPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    const container = canvasContainerRef.current;
    if (!session || !container || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    container.scrollLeft = session.startScrollLeft - (event.clientX - session.startX);
    container.scrollTop = session.startScrollTop - (event.clientY - session.startY);
  }, []);
  const handleCanvasPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    panSessionRef.current = null;
    setIsCanvasPanning(false);
    if ((event.currentTarget as HTMLDivElement).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    }
  }, []);
  const canvasGeometry = useMemo(
    () => computeCanvasGeometry(canvasScale),
    [canvasScale, computeCanvasGeometry]
  );
  const handleCanvasWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) return;
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.0015);
      zoomToPoint(canvasScale * zoomFactor, event.clientX, event.clientY);
    },
    [canvasScale, zoomToPoint]
  );
  const handleCanvasKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) return;
      if (event.key !== "+" && event.key !== "=" && event.key !== "-" && event.key !== "_") {
        return;
      }
      event.preventDefault();
      adjustZoomByStep(event.key === "-" || event.key === "_" ? -1 : 1);
    },
    [adjustZoomByStep]
  );

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

  function persistEcomBuilderPatch(patch: Partial<ProjectSpec["builder"]>) {
    if (!safeSpec || !isEcom) return;
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

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      const nextHeight = entry.contentRect.height;
      setCanvasViewport((prev) => {
        if (
          Math.abs(prev.width - nextWidth) < 0.5 &&
          Math.abs(prev.height - nextHeight) < 0.5
        ) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fit = computeFitScale();
    setCanvasFitScale(fit);
    if (stickToFitRef.current) {
      setCanvasScale(fit);
      centerViewportForScale(fit);
    }
  }, [centerViewportForScale, computeFitScale]);

  useEffect(() => {
    resetCanvasToFit();
  }, [
    resetCanvasToFit,
    active?.id,
    bgUrl,
    safeSpec?.module,
    safeSpec?.generation?.width,
    safeSpec?.generation?.height,
  ]);

  async function createVariations() {
    if (!safeSpec || safeSpec.module !== "social_post") {
      generateMock();
      return;
    }
    setIsBatchExporting(true);
    setBatchProgress({ current: 0, total: 10 });
    setLastExportError(null);
    const variations = [
      { textScale: 0.96, overlayOpacity: 0.18, topPadScale: 1.06, productScale: 0.98, blurBoost: 1.0 },
      { textScale: 1.0, overlayOpacity: 0.2, topPadScale: 1.0, productScale: 1.0, blurBoost: 1.0 },
      { textScale: 1.03, overlayOpacity: 0.22, topPadScale: 0.98, productScale: 1.02, blurBoost: 1.05 },
      { textScale: 0.98, overlayOpacity: 0.19, topPadScale: 1.04, productScale: 0.96, blurBoost: 0.96 },
      { textScale: 1.05, overlayOpacity: 0.23, topPadScale: 0.95, productScale: 1.04, blurBoost: 1.08 },
      { textScale: 0.94, overlayOpacity: 0.17, topPadScale: 1.08, productScale: 0.94, blurBoost: 0.92 },
      { textScale: 1.02, overlayOpacity: 0.21, topPadScale: 1.02, productScale: 1.01, blurBoost: 1.02 },
      { textScale: 0.99, overlayOpacity: 0.2, topPadScale: 0.97, productScale: 1.05, blurBoost: 1.04 },
      { textScale: 1.04, overlayOpacity: 0.24, topPadScale: 0.94, productScale: 1.03, blurBoost: 1.1 },
      { textScale: 0.97, overlayOpacity: 0.18, topPadScale: 1.05, productScale: 0.97, blurBoost: 0.95 },
    ] as const;
    try {
      for (let i = 0; i < variations.length; i += 1) {
        setBatchProgress({ current: i + 1, total: variations.length });
        await exportSocialPost2K({
          fileName: `social-post-2k-${String(i + 1).padStart(2, "0")}.png`,
          variation: variations[i],
        });
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      toast({ title: t("editor.toast.variations_exported") });
    } catch {
      setLastExportError(t("editor.toast.batch_export_failed"));
      toast({
        title: t("editor.toast.batch_export_failed"),
        variant: "destructive",
      });
    } finally {
      setIsBatchExporting(false);
      setBatchProgress(null);
    }
  }

  async function exportSocialPost2K(opts?: {
    fileName?: string;
    variation?: {
      textScale?: number;
      overlayOpacity?: number;
      topPadScale?: number;
      productScale?: number;
      blurBoost?: number;
    };
  }): Promise<void> {
    if (!safeSpec || safeSpec.module !== "social_post") {
      console.log("activeGenerationId:", project?.activeGenerationId ?? null);
      console.log("generationWidth:", safeSpec?.generation?.width ?? null);
      console.log("generationHeight:", safeSpec?.generation?.height ?? null);
      return;
    }

    const gw = safeSpec.generation?.width ?? 1080;
    const gh = safeSpec.generation?.height ?? 1080;
    const longest = 2048;
    const canvasWidth = gw >= gh ? longest : Math.round((gw / gh) * longest);
    const canvasHeight = gh > gw ? longest : Math.round((gh / gw) * longest);

    const headlineText = (safeSpec.builder.headline || content.headline || "").trim();
    const subheadlineText = (safeSpec.builder.subheadline || content.subheadline || "").trim();
    const ctaText = (safeSpec.builder.cta || content.ctaText || "").trim();
    const backgroundUrl = safeSpec.builder.backgroundUploads?.[0] || bgUrl || "";
    const logoUrl = safeSpec.builder.logoUploads?.[0] || "";
    const productUrl = safeSpec.builder.productUploads?.[0] || "";
    const premiumOverlayUrl = safeSpec.builder.premiumOverlayUrls?.[0] || "";
    const platformPreset = String(safeSpec.builder.platformPreset ?? "").trim().toLowerCase();
    const isVerticalPlatform =
      platformPreset === "instagram_story" || platformPreset === "tiktok_vertical";
    const layoutRaw = String(safeSpec.builder.layoutPreset ?? "").trim().toLowerCase();
    const layoutPreset =
      layoutRaw === "split"
        ? "split"
        : layoutRaw === "brutalist"
        ? "brutalist"
        : layoutRaw === "glass"
        ? "glass"
        : layoutRaw.includes("overlay")
        ? "overlay_bottom"
        : layoutRaw.includes("minimal")
        ? "minimal"
        : "hero";
    const rawFont =
      getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const primaryFont =
      rawFont.split(",")[0]?.replace(/["']/g, "").trim() || "system-ui";
    const exportFontFamily = `${primaryFont}, system-ui, sans-serif`;
    const fileName = opts?.fileName ?? "social-post-2k.png";
    const textScale = opts?.variation?.textScale ?? 1;
    const overlayOpacity = clamp(opts?.variation?.overlayOpacity ?? 0.2, 0, 1);
    const topPadScale = opts?.variation?.topPadScale ?? 1;
    const productScale = opts?.variation?.productScale ?? 1;
    const blurBoost = opts?.variation?.blurBoost ?? 1;

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 64)}`));
        img.src = src;
      });

    const drawCover = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      w: number,
      h: number
    ) => {
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const wrapTextLines = (
      ctx: CanvasRenderingContext2D,
      text: string,
      maxWidth: number,
      maxLines: number
    ): string[] => {
      if (!text) return [];
      const fitLineWithEllipsis = (input: string): string => {
        const raw = input.trim();
        if (!raw) return "";
        if (ctx.measureText(raw).width <= maxWidth) return raw;
        const ellipsis = "...";
        let end = raw.length;
        while (end > 0) {
          const candidate = `${raw.slice(0, end).trimEnd()}${ellipsis}`;
          if (ctx.measureText(candidate).width <= maxWidth) return candidate;
          end -= 1;
        }
        return ellipsis;
      };
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = "";
      for (let i = 0; i < words.length; i += 1) {
        const next = current ? `${current} ${words[i]}` : words[i];
        if (ctx.measureText(next).width <= maxWidth) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = words[i];
          if (lines.length >= maxLines) {
            const overflow = [current, ...words.slice(i + 1)].join(" ");
            lines[maxLines - 1] = fitLineWithEllipsis(
              [lines[maxLines - 1], overflow].filter(Boolean).join(" ")
            );
            return lines.slice(0, maxLines);
          }
        }
      }
      if (current && lines.length < maxLines) lines.push(current);
      if (lines.length <= maxLines) return lines;
      const trimmed = lines.slice(0, maxLines);
      const overflow = lines.slice(maxLines).join(" ");
      trimmed[maxLines - 1] = fitLineWithEllipsis(
        [trimmed[maxLines - 1], overflow].filter(Boolean).join(" ")
      );
      return trimmed;
    };

    const truncateWithEllipsis = (text: string, maxChars: number): string => {
      const normalized = text.trim();
      if (normalized.length <= maxChars) return normalized;
      if (maxChars <= 3) return "...";
      return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
    };

    const downloadCanvas = (canvas: HTMLCanvasElement) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return;
          }
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
        },
        "image/png"
      );
    };

    const blurBackdropRoundedRect = (
      ctx: CanvasRenderingContext2D,
      sourceCanvas: HTMLCanvasElement,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      blurPx: number
    ) => {
      if (w <= 0 || h <= 0) return;
      const sx = Math.round(x);
      const sy = Math.round(y);
      const sw = Math.round(w);
      const sh = Math.round(h);
      const rr = Math.min(r, sw / 2, sh / 2);
      const temp = document.createElement("canvas");
      temp.width = Math.max(1, sw);
      temp.height = Math.max(1, sh);
      const tempCtx = temp.getContext("2d");
      if (!tempCtx) return;
      tempCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx + rr, sy);
      ctx.lineTo(sx + sw - rr, sy);
      ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + rr);
      ctx.lineTo(sx + sw, sy + sh - rr);
      ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - rr, sy + sh);
      ctx.lineTo(sx + rr, sy + sh);
      ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - rr);
      ctx.lineTo(sx, sy + rr);
      ctx.quadraticCurveTo(sx, sy, sx + rr, sy);
      ctx.closePath();
      ctx.clip();
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(temp, sx, sy, sw, sh);
      ctx.filter = "none";
      ctx.restore();
    };

    const drawPresetLayer = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      assets: { logo: HTMLImageElement | null; product: HTMLImageElement | null }
    ) => {
      const marginX = Math.round(w * 0.06);
      const topPad = Math.round(
        (isVerticalPlatform ? Math.round(h * 0.12) : Math.round(h * 0.06)) * topPadScale
      );
      const bottomPad = Math.round(
        (isVerticalPlatform ? Math.round(h * 0.12) : Math.round(h * 0.08)) * topPadScale
      );
      const textTopBump = assets.logo ? Math.round(h * 0.08) : 0;
      const isVertical = h > w;
      const scaleProductRatio = (baseRatio: number) =>
        clamp(baseRatio * productScale, baseRatio * 0.85, baseRatio * 1.15);

      const drawLogo = () => {
        if (!assets.logo) return;
        const logoTargetH = Math.round(h * 0.1);
        const logoW = Math.round((assets.logo.width / assets.logo.height) * logoTargetH);
        ctx.drawImage(assets.logo, marginX, topPad, logoW, logoTargetH);
      };

      const drawProductBottomRight = (ratio: number) => {
        if (!assets.product) return;
        const ph = Math.round(h * scaleProductRatio(ratio));
        const pw = Math.round((assets.product.width / assets.product.height) * ph);
        ctx.drawImage(assets.product, w - marginX - pw, h - bottomPad - ph, pw, ph);
      };

      const drawTextBlock = (
        opts: {
          x: number;
          y: number;
          maxWidth: number;
          align?: "left" | "center";
          headlineSize: number;
          subSize: number;
          ctaSize: number;
          anchor?: "top" | "bottom" | "center";
          bottomLift?: number;
        }
      ) => {
        const align = opts.align ?? "left";
        const anchor = opts.anchor ?? "top";
        const bottomLift = opts.bottomLift ?? 0;
        const ctaPadX = Math.round(w * 0.018);
        const ctaPadY = Math.round(h * 0.01);
        const ctaMaxChars = Math.max(16, Math.min(28, Math.round(w * 0.012)));
        const headlineSize = Math.max(1, Math.round(opts.headlineSize * textScale));
        const subSize = Math.max(1, Math.round(opts.subSize * textScale));
        const ctaSize = Math.max(1, Math.round(opts.ctaSize * textScale));
        ctx.textAlign = align;
        ctx.textBaseline = "alphabetic";

        ctx.font = `800 ${headlineSize}px ${exportFontFamily}`;
        const headlineLines = wrapTextLines(ctx, headlineText, opts.maxWidth, 2);
        const headlineHeight = headlineLines.length * Math.round(headlineSize * 1.08);

        ctx.font = `700 ${subSize}px ${exportFontFamily}`;
        const subLines = wrapTextLines(ctx, subheadlineText, opts.maxWidth, 2);
        const subHeight = subLines.length * Math.round(subSize * 1.2);

        ctx.font = `700 ${ctaSize}px ${exportFontFamily}`;
        const ctaDrawText = ctaText ? truncateWithEllipsis(ctaText, ctaMaxChars) : "";
        const ctaHeight = ctaDrawText ? ctaSize + ctaPadY * 2 : 0;
        const gapA = headlineLines.length && subLines.length ? Math.round(h * 0.015) : 0;
        const gapB =
          (headlineLines.length || subLines.length) && ctaDrawText ? Math.round(h * 0.02) : 0;
        const totalHeight = headlineHeight + gapA + subHeight + gapB + ctaHeight;
        let y = opts.y;
        if (anchor === "bottom") {
          y = Math.max(topPad + textTopBump, h - bottomPad - totalHeight - bottomLift);
        }
        if (anchor === "center") {
          y = Math.max(topPad + textTopBump, Math.round((h - totalHeight) / 2));
        }

        let cursorY = y + headlineSize;
        if (headlineLines.length) {
          ctx.fillStyle = "rgba(255,255,255,1)";
          ctx.font = `800 ${headlineSize}px ${exportFontFamily}`;
          headlineLines.forEach((line, idx) => {
            ctx.fillText(line, opts.x, cursorY + idx * Math.round(headlineSize * 1.08));
          });
          cursorY += headlineHeight + gapA;
        }

        if (subLines.length) {
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.font = `700 ${subSize}px ${exportFontFamily}`;
          subLines.forEach((line, idx) => {
            ctx.fillText(line, opts.x, cursorY + idx * Math.round(subSize * 1.2));
          });
          cursorY += subHeight + gapB;
        }

        if (ctaDrawText) {
          ctx.font = `700 ${ctaSize}px ${exportFontFamily}`;
          const ctaWidth = Math.round(ctx.measureText(ctaDrawText).width + ctaPadX * 2);
          const ctaLeft = align === "center" ? Math.round(opts.x - ctaWidth / 2) : opts.x;
          const ctaY = cursorY - ctaSize;
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          const radius = Math.round(ctaHeight / 2);
          ctx.beginPath();
          ctx.moveTo(ctaLeft + radius, ctaY);
          ctx.lineTo(ctaLeft + ctaWidth - radius, ctaY);
          ctx.quadraticCurveTo(ctaLeft + ctaWidth, ctaY, ctaLeft + ctaWidth, ctaY + radius);
          ctx.lineTo(ctaLeft + ctaWidth, ctaY + ctaHeight - radius);
          ctx.quadraticCurveTo(
            ctaLeft + ctaWidth,
            ctaY + ctaHeight,
            ctaLeft + ctaWidth - radius,
            ctaY + ctaHeight
          );
          ctx.lineTo(ctaLeft + radius, ctaY + ctaHeight);
          ctx.quadraticCurveTo(ctaLeft, ctaY + ctaHeight, ctaLeft, ctaY + ctaHeight - radius);
          ctx.lineTo(ctaLeft, ctaY + radius);
          ctx.quadraticCurveTo(ctaLeft, ctaY, ctaLeft + radius, ctaY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.95)";
          ctx.fillText(
            ctaDrawText,
            align === "center" ? opts.x : ctaLeft + ctaPadX,
            ctaY + ctaHeight - ctaPadY
          );
        }
      };

      const drawHero = () => {
        drawLogo();
        drawTextBlock({
          x: Math.round(w / 2),
          y: topPad + textTopBump,
          maxWidth: Math.round(w * 0.84),
          align: "center",
          headlineSize: Math.max(24, Math.round(w * 0.1)),
          subSize: Math.max(16, Math.round(w * 0.055)),
          ctaSize: Math.max(14, Math.round(w * 0.036)),
          anchor: "center",
        });
        drawProductBottomRight(isVerticalPlatform ? 0.24 : 0.28);
      };

      const drawSplit = () => {
        drawLogo();
        if (isVertical) {
          const splitTopExtra = isVerticalPlatform ? Math.round(h * 0.03) : Math.round(h * 0.015);
          drawTextBlock({
            x: marginX,
            y: topPad + textTopBump + splitTopExtra,
            maxWidth: Math.round(w - marginX * 2),
            headlineSize: Math.max(24, Math.round(w * 0.085)),
            subSize: Math.max(15, Math.round(w * 0.045)),
            ctaSize: Math.max(13, Math.round(w * 0.032)),
            anchor: "top",
          });
          if (assets.product) {
            const splitProductRatio = isVerticalPlatform ? 0.34 : 0.42;
            const ph = Math.round(h * scaleProductRatio(splitProductRatio));
            const pw = Math.round((assets.product.width / assets.product.height) * ph);
            const splitBottomLift = isVerticalPlatform ? Math.round(h * 0.02) : 0;
            ctx.drawImage(
              assets.product,
              Math.round((w - pw) / 2),
              h - bottomPad - ph - splitBottomLift,
              pw,
              ph
            );
          }
          return;
        }
        drawTextBlock({
          x: marginX,
          y: topPad + textTopBump,
          maxWidth: Math.round(w * 0.44),
          headlineSize: Math.max(24, Math.round(w * 0.085)),
          subSize: Math.max(15, Math.round(w * 0.04)),
          ctaSize: Math.max(13, Math.round(w * 0.03)),
          anchor: "center",
        });
        if (assets.product) {
          const ph = Math.round(h * scaleProductRatio(0.72));
          const pw = Math.round((assets.product.width / assets.product.height) * ph);
          const x = Math.round(w * 0.58 + (w * 0.42 - pw) / 2);
          const y = Math.round((h - ph) / 2);
          ctx.drawImage(assets.product, x, y, pw, ph);
        }
      };

      const drawOverlayBottom = () => {
        drawLogo();
        const grad = ctx.createLinearGradient(0, h * 0.45, 0, h);
        grad.addColorStop(0, "rgba(0,0,0,0.05)");
        grad.addColorStop(0.65, "rgba(0,0,0,0.35)");
        grad.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        drawTextBlock({
          x: marginX,
          y: topPad + textTopBump,
          maxWidth: Math.round(w * 0.82),
          headlineSize: Math.max(24, Math.round(w * (isVerticalPlatform ? 0.08 : 0.095))),
          subSize: Math.max(15, Math.round(w * 0.038)),
          ctaSize: Math.max(13, Math.round(w * 0.03)),
          anchor: "bottom",
          bottomLift: isVerticalPlatform ? Math.round(h * 0.04) : Math.round(h * 0.015),
        });
      };

      const drawMinimal = () => {
        drawLogo();
        drawTextBlock({
          x: marginX,
          y: topPad + textTopBump,
          maxWidth: Math.round(w * 0.5),
          headlineSize: Math.max(18, Math.round(w * 0.045)),
          subSize: Math.max(14, Math.round(w * 0.03)),
          ctaSize: Math.max(12, Math.round(w * 0.024)),
          anchor: "top",
        });
        if (assets.product) {
          const ph = Math.round(h * scaleProductRatio(isVerticalPlatform ? 0.42 : 0.5));
          const pw = Math.round((assets.product.width / assets.product.height) * ph);
          const py = Math.round((h - ph) / 2) + Math.round(textTopBump * 0.25);
          ctx.drawImage(assets.product, Math.round((w - pw) / 2), py, pw, ph);
        }
      };

      const drawBrutalist = () => {
        drawLogo();
        const headlineSize = Math.max(24, Math.round(w * 0.08 * textScale));
        const subSize = Math.max(14, Math.round(w * 0.03 * textScale));
        const maxWidth = Math.round(w * 0.6);

        ctx.font = `900 ${headlineSize}px ${exportFontFamily}`;
        const headlineLines = wrapTextLines(ctx, headlineText, maxWidth, 2);
        const subLines = wrapTextLines(ctx, subheadlineText, maxWidth, 2);
        const ctaDrawText = truncateWithEllipsis(ctaText, Math.max(16, Math.round(w * 0.012)));
        let y = topPad + textTopBump + headlineSize;

        ctx.fillStyle = "rgba(0,0,0,0.92)";
        headlineLines.forEach((line, idx) => {
          const lineY = y + idx * Math.round(headlineSize * 1.08);
          const textW = Math.round(ctx.measureText(line).width);
          ctx.fillRect(marginX - 12, lineY - headlineSize, textW + 24, headlineSize + 14);
          ctx.fillStyle = "white";
          ctx.fillText(line, marginX, lineY);
          ctx.fillStyle = "rgba(0,0,0,0.92)";
        });

        y += headlineLines.length * Math.round(headlineSize * 1.08) + Math.round(h * 0.02);
        ctx.font = `700 ${subSize}px ${exportFontFamily}`;
        subLines.forEach((line, idx) => {
          const lineY = y + idx * Math.round(subSize * 1.2);
          const textW = Math.round(ctx.measureText(line).width);
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillRect(marginX - 10, lineY - subSize, textW + 20, subSize + 12);
          ctx.fillStyle = "rgba(0,0,0,0.95)";
          ctx.fillText(line, marginX, lineY);
        });

        if (ctaDrawText) {
          ctx.font = `800 ${Math.max(13, Math.round(w * 0.028 * textScale))}px ${exportFontFamily}`;
          const ctaW = Math.round(ctx.measureText(ctaDrawText).width) + 28;
          const ctaH = Math.round(h * 0.06);
          const ctaY = h - bottomPad - ctaH;
          ctx.fillStyle = "rgba(0,0,0,0.95)";
          ctx.fillRect(marginX, ctaY, ctaW, ctaH);
          ctx.fillStyle = "white";
          ctx.fillText(ctaDrawText, marginX + 14, ctaY + Math.round(ctaH * 0.7));
        }

        drawProductBottomRight(isVerticalPlatform ? 0.32 : 0.44);
      };

      const drawGlass = () => {
        drawLogo();
        const cardW = Math.round(w * 0.78);
        const cardH = Math.round(h * (isVertical ? 0.42 : 0.36));
        const cardX = Math.round((w - cardW) / 2);
        const cardY = Math.max(topPad + textTopBump, Math.round((h - cardH) / 2));
        const radius = Math.round(Math.min(cardW, cardH) * 0.08);
        const baseBlurPx = Math.min(28, Math.round(Math.max(14, w * 0.01)));
        const blurPx = clamp(Math.round(baseBlurPx * blurBoost), 10, 28);
        blurBackdropRoundedRect(
          ctx,
          ctx.canvas as HTMLCanvasElement,
          cardX,
          cardY,
          cardW,
          cardH,
          radius,
          blurPx
        );

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cardX + radius, cardY);
        ctx.lineTo(cardX + cardW - radius, cardY);
        ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
        ctx.lineTo(cardX + cardW, cardY + cardH - radius);
        ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
        ctx.lineTo(cardX + radius, cardY + cardH);
        ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
        ctx.lineTo(cardX, cardY + radius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawTextBlock({
          x: Math.round(w / 2),
          y: cardY + Math.round(cardH * 0.18),
          maxWidth: Math.round(cardW * 0.82),
          align: "center",
          headlineSize: Math.max(22, Math.round(w * 0.08)),
          subSize: Math.max(15, Math.round(w * 0.04)),
          ctaSize: Math.max(13, Math.round(w * 0.03)),
          anchor: "top",
        });

        drawProductBottomRight(isVerticalPlatform ? 0.3 : 0.36);
      };

      if (layoutPreset === "split") {
        drawSplit();
        return;
      }
      if (layoutPreset === "overlay_bottom") {
        drawOverlayBottom();
        return;
      }
      if (layoutPreset === "minimal") {
        drawMinimal();
        return;
      }
      if (layoutPreset === "brutalist") {
        drawBrutalist();
        return;
      }
      if (layoutPreset === "glass") {
        drawGlass();
        return;
      }
      drawHero();
    };

    const drawTextOnlyFallbackAndDownload = () => {
      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.width = canvasWidth;
      fallbackCanvas.height = canvasHeight;
      const fallbackCtx = fallbackCanvas.getContext("2d");
      if (!fallbackCtx) return;
      const grad = fallbackCtx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, "#1f2937");
      grad.addColorStop(1, "#111827");
      fallbackCtx.fillStyle = grad;
      fallbackCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      fallbackCtx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
      fallbackCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      drawPresetLayer(fallbackCtx, canvasWidth, canvasHeight, { logo: null, product: null });
      downloadCanvas(fallbackCanvas);
    };

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      if ("fonts" in document) {
        await (document as any).fonts.ready;
        await (document as any).fonts.load(`700 24px ${primaryFont}`);
        await (document as any).fonts.load(`800 24px ${primaryFont}`);
        await (document as any).fonts.load(`900 24px ${primaryFont}`);
      }
    } catch {
      // Best-effort font preloading; continue export if unavailable.
    }

    try {
      if (backgroundUrl) {
        const bgImg = await loadImage(backgroundUrl);
        drawCover(ctx, bgImg, canvasWidth, canvasHeight);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, "#171717");
        gradient.addColorStop(1, "#404040");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const logo = logoUrl ? await loadImage(logoUrl) : null;
      const product = productUrl ? await loadImage(productUrl) : null;
      drawPresetLayer(ctx, canvasWidth, canvasHeight, { logo, product });

      if (premiumOverlayUrl) {
        const overlay = await loadImage(premiumOverlayUrl);
        ctx.drawImage(overlay, 0, 0, canvasWidth, canvasHeight);
      }

      downloadCanvas(canvas);
    } catch (err) {
      console.warn("2K export fallback due to image/CORS issue:", err);
      drawTextOnlyFallbackAndDownload();
    }
  }

  async function export2K() {
    if (!safeSpec || safeSpec.module !== "social_post") {
      console.log("activeGenerationId:", project?.activeGenerationId ?? null);
      console.log("generationWidth:", safeSpec?.generation?.width ?? null);
      console.log("generationHeight:", safeSpec?.generation?.height ?? null);
      return;
    }

    setIsExporting2K(true);
    setLastExportError(null);
    try {
      await exportSocialPost2K({ fileName: "social-post-2k.png" });
      toast({ title: t("editor.toast.export_ready") });
    } catch {
      setLastExportError(t("editor.toast.export_failed"));
      toast({
        title: t("editor.toast.export_failed"),
        variant: "destructive",
      });
    } finally {
      setIsExporting2K(false);
    }
  }

  // estados bÃ¡sicos
  if (!id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
          </div>
          <div className="text-sm text-muted-foreground">{t("editor.state.missing_project_id")}</div>
          <Button variant="secondary" onClick={() => nav("/app/projects")}>
            {t("editor.state.back_to_projects")}
          </Button>
        </div>
      </div>
    );
  }

  if (!project || !safeSpec) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
          </div>
          <div>
            <div className="text-lg font-semibold">{t("editor.state.project_not_found")}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("editor.state.project_not_found_detail")}
            </div>
          </div>
          <div className="flex gap-2 justify-center">
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
      </div>
    );
  }

  const sectionSpacing = compactMode ? "space-y-4" : "space-y-6";
  const fieldSpacing = compactMode ? "space-y-2" : "space-y-3";
  const sectionTitle = compactMode
    ? "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/30 mb-2"
    : "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30 mb-3";

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* TOP HEADER */}
      <div className="px-4 md:px-6 py-2.5 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {project.name}
              </h1>

              {!focusMode && (
                <div className="hidden md:flex gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {safeSpec.module}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {safeSpec.format}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {safeSpec.stylePreset}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Focus Mode */}
            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className={[
                "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                focusMode
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted border border-transparent",
              ].join(" ")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              Focus
            </button>

            {/* Compact Mode */}
            <button
              type="button"
              onClick={() => setCompactMode(!compactMode)}
              className={[
                "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                compactMode
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted border border-transparent",
              ].join(" ")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              {compactMode ? "Comfortable" : "Compact"}
            </button>

            <div className="w-px h-5 bg-border/60 mx-1 hidden md:block" />

            <Button variant="outline" size="sm" onClick={() => nav("/app/projects")}>
              {t("editor.header.back")}
            </Button>

            <Button size="sm" className="font-medium btn-gradient" onClick={generateMock}>{t("editor.header.generate_base_image")}</Button>
          </div>
        </div>
      </div>

      {/* Progress checklist bar */}
      {!focusMode && (() => {
        const hasSubject = !!(subjectImageUrl || safeSpec.subjectText?.trim() || safeSpec.builder?.subjectType);
        const hasStyle = !!(safeSpec.builder?.scenePreset || safeSpec.builder?.sceneMood || (safeSpec.builder?.visualStyle?.length ?? 0) > 0);
        const hasGenerations = (project.generations?.length ?? 0) > 0;
        const hasExportReady = project.generations?.some(g => g.status === "done" && g.imageUrl) ?? false;

        const steps = [
          { label: "Subject", done: hasSubject },
          { label: "Style", done: hasStyle },
          { label: "Generated", done: hasGenerations },
          { label: "Export ready", done: hasExportReady },
        ];

        const completedCount = steps.filter(s => s.done).length;
        if (completedCount === 4) return null;

        return (
          <div className="px-4 md:px-6 py-1.5 border-b border-border/40 bg-card/50 flex items-center gap-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 ${
                  step.done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/50 text-muted-foreground/40"
                }`}>
                  {step.done ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <span className="text-[8px] font-medium">{i + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-150 ${
                  step.done ? "text-foreground/70" : "text-muted-foreground/50"
                }`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-4 h-px ml-1 ${step.done ? "bg-primary/30" : "bg-border/40"}`} />
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* 3-COL LAYOUT: Inspector (left) | Canvas (center) | Templates (right) */}
      <div className={[
        "flex-1 min-h-0 grid grid-cols-1 transition-all duration-200",
        focusMode
          ? "lg:grid-cols-[1fr]"
          : templatesPanelOpen
            ? "lg:grid-cols-[360px_1fr_240px]"
            : "lg:grid-cols-[360px_1fr_60px]",
      ].join(" ")}>

        {/* Empty placeholder removed — inspector uses CSS order from old RIGHT panel */}

        {/* TEMPLATES — visually RIGHT via order-3 */}
        {!focusMode && (
        <div className="hidden lg:flex flex-col min-h-0 border-l border-border/40 order-3">
          <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
            {templatesPanelOpen ? (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("editor.templates.title")}</div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setTemplatesPanelOpen(!templatesPanelOpen)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              title={templatesPanelOpen ? "Collapse" : "Expand"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {templatesPanelOpen ? (
                  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
                ) : (
                  <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>
                )}
              </svg>
            </button>
          </div>

          {templatesPanelOpen ? (
            <div className="p-2.5 space-y-1.5 overflow-auto flex-1">
              {TEMPLATE_REGISTRY.filter((t) => t.module === safeSpec.module).map((tpl) => {
                const selected = safeSpec.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className={[
                      "w-full text-left rounded-lg p-2 transition-all duration-150 group",
                      selected
                        ? "bg-card border-l-2 border-l-primary border border-border/60"
                        : "border border-transparent hover:bg-card/60 hover:-translate-y-px",
                    ].join(" ")}
                    onClick={() => {
                      persistSpec({
                        ...safeSpec,
                        templateId: tpl.id as any,
                        stylePreset: (tpl.stylePreset ?? safeSpec.stylePreset) as StylePreset,
                      });
                    }}
                  >
                    <div className="h-12 rounded-md bg-muted/60 mb-1" />
                    <div className="text-[11px] font-medium truncate">{t(tpl.nameKey)}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-1.5 space-y-1.5 overflow-auto flex-1">
              {TEMPLATE_REGISTRY.filter((t) => t.module === safeSpec.module).map((tpl) => {
                const selected = safeSpec.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className={[
                      "w-full aspect-square rounded-lg transition-all duration-150",
                      selected
                        ? "bg-card border-2 border-primary/40"
                        : "bg-muted/40 hover:bg-card/60",
                    ].join(" ")}
                    onClick={() => {
                      persistSpec({
                        ...safeSpec,
                        templateId: tpl.id as any,
                        stylePreset: (tpl.stylePreset ?? safeSpec.stylePreset) as StylePreset,
                      });
                    }}
                    title={t(tpl.nameKey)}
                  />
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* CENTER: CANVAS — order-2 */}
        <div className={[
          "min-h-0 flex flex-col order-2",
          focusMode ? "bg-muted/30" : "bg-muted/20",
        ].join(" ")}>
          {/* Canvas action bar */}
          <div className="flex items-center justify-end gap-1.5 px-4 py-1.5">
            <button
              type="button"
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={[
                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150",
                showGridOverlay
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted border border-transparent",
              ].join(" ")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              Grid
            </button>
          </div>
          <div className="flex-1 min-h-0 px-4 md:px-6 pb-4 md:pb-6 overflow-hidden">
            <div
              ref={canvasContainerRef}
              tabIndex={0}
              onWheel={handleCanvasWheel}
              onKeyDown={handleCanvasKeyDown}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className={[
                "relative h-full min-h-0 overflow-auto rounded-2xl border border-border/40 shadow-[0_2px_24px_rgba(0,0,0,0.08)] bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isCanvasPanning ? "cursor-grabbing" : "cursor-grab",
              ].join(" ")}
            >
              {/* Grid overlay */}
              {showGridOverlay && (
                <div
                  className="absolute inset-0 pointer-events-none z-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--border) / 0.15) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.15) 1px, transparent 1px)",
                    backgroundSize: "8px 8px",
                  }}
                />
              )}
              <div className="relative min-h-full min-w-full bg-muted/30">
                <div
                  style={{
                    width: `${canvasGeometry.innerWidth}px`,
                    height: `${canvasGeometry.innerHeight}px`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `${canvasGeometry.originX}px`,
                      top: `${canvasGeometry.originY}px`,
                      width: `${previewBaseSize.width}px`,
                      height: `${previewBaseSize.height}px`,
                      transform: `scale(${canvasScale})`,
                      transformOrigin: "0 0",
                    }}
                  >
                    <div className="w-full h-full">
                    {isSocialPost ? (
                      (() => {
                        const layoutRaw = (safeSpec.builder.layoutPreset ?? "").trim().toLowerCase();
                        const layoutPreset =
                          layoutRaw === "split"
                            ? "split"
                            : layoutRaw === "brutalist"
                            ? "brutalist"
                            : layoutRaw === "glass"
                            ? "glass"
                            : layoutRaw.includes("overlay")
                            ? "overlay_bottom"
                            : layoutRaw.includes("minimal")
                            ? "minimal"
                            : "hero";
                        const gw = safeSpec.generation?.width ?? 1080;
                        const gh = safeSpec.generation?.height ?? 1080;
                        const isVertical = gh > gw;
                        const platformPreset = String(safeSpec.builder.platformPreset ?? "").trim().toLowerCase();
                        const isVerticalPlatform =
                          platformPreset === "instagram_story" || platformPreset === "tiktok_vertical";
                        const verticalTextPadClass = isVerticalPlatform
                          ? "pt-12 pb-12 md:pt-14 md:pb-14"
                          : "";
                        const marginClass = "left-6 right-6";
                        const logoHClass = "h-14 md:h-16";
                        const productMaxHSmallClass = isVerticalPlatform ? "max-h-[30%]" : "max-h-[36%]";
                        const productMaxHMediumClass = isVerticalPlatform ? "max-h-[32%]" : "max-h-[44%]";
                        const productMaxHLargeClass = isVerticalPlatform ? "max-h-[42%]" : "max-h-[50%]";
                        const productSplitVerticalClass = isVerticalPlatform
                          ? "max-h-[36%]"
                          : "max-h-[44%]";
                        const productHeroHClass = isVerticalPlatform ? "h-[24%]" : "h-[28%]";
                        const logoTopClass = isVerticalPlatform ? "top-10" : "top-6";
                        const bottomTextClass = isVerticalPlatform ? "bottom-14" : "bottom-8";
                        const productBottomClass = isVerticalPlatform ? "bottom-10" : "bottom-6";
                        const headlineText = safeSpec.builder.headline || content.headline;
                        const subheadlineText = safeSpec.builder.subheadline || content.subheadline;
                        const ctaText = safeSpec.builder.cta || content.ctaText;
                        const twoLineClampStyle = {
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        };
                        const productUrl = safeSpec.builder.productUploads?.[0] || "";
                        const logoUrl = safeSpec.builder.logoUploads?.[0] || "";
                        const hasLogo = Boolean(logoUrl);
                        const textTopBumpClass = hasLogo ? "pt-16 md:pt-20" : "";
                        const bgImage = safeSpec.builder.backgroundUploads?.[0] || bgUrl || "";

                        return (
                          <div className="relative h-full w-full overflow-hidden rounded-xl">
                            {bgImage ? (
                              <img
                                src={bgImage}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-700" />
                            )}
                            <div
                              className={[
                                "absolute inset-0",
                                layoutPreset === "overlay_bottom"
                                  ? "bg-gradient-to-t from-black/75 via-black/30 to-black/10"
                                  : "bg-black/20",
                              ].join(" ")}
                            />
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt=""
                                className={`absolute left-6 w-auto object-contain z-20 ${logoHClass} ${logoTopClass}`}
                              />
                            ) : null}

                            {layoutPreset === "split" ? (
                              <div
                                className={[
                                  "absolute inset-0 z-10 p-6 md:p-8 gap-6",
                                  verticalTextPadClass,
                                  textTopBumpClass,
                                  isVertical ? "grid grid-rows-[auto_1fr]" : "grid grid-cols-2 items-center",
                                ].join(" ")}
                              >
                                <div className="space-y-3 md:space-y-4">
                                  <div
                                    className="text-white text-4xl md:text-5xl font-bold leading-tight"
                                    style={twoLineClampStyle}
                                  >
                                    {headlineText}
                                  </div>
                                  <div
                                    className="text-white/90 text-base md:text-lg"
                                    style={twoLineClampStyle}
                                  >
                                    {subheadlineText}
                                  </div>
                                  <div className="inline-flex rounded-full px-4 py-2 text-sm font-medium bg-white/90 text-black">
                                    <span className="max-w-[28ch] truncate">{ctaText}</span>
                                  </div>
                                </div>
                                {productUrl ? (
                                  <div className="flex items-center justify-center">
                                    <img
                                      src={productUrl}
                                      alt=""
                                      className={[
                                        "w-auto object-contain",
                                        isVertical ? productSplitVerticalClass : "max-h-[72%]",
                                      ].join(" ")}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {layoutPreset === "overlay_bottom" ? (
                              <div className={`absolute ${marginClass} z-10 space-y-3 ${bottomTextClass}`}>
                                <div
                                  className={`text-white font-bold leading-[0.95] md:text-6xl ${isVerticalPlatform ? "text-4xl" : "text-5xl"}`}
                                  style={twoLineClampStyle}
                                >
                                  {headlineText}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div
                                    className="text-white/90 text-base md:text-lg max-w-[70%]"
                                    style={twoLineClampStyle}
                                  >
                                    {subheadlineText}
                                  </div>
                                  <div className="inline-flex rounded-full px-4 py-2 text-sm font-medium bg-white/90 text-black">
                                    <span className="max-w-[22ch] truncate">{ctaText}</span>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {layoutPreset === "minimal" ? (
                              <div className={`absolute inset-0 z-10 p-6 ${verticalTextPadClass} ${textTopBumpClass}`}>
                                <div
                                  className="text-white text-lg md:text-xl font-semibold tracking-tight"
                                  style={twoLineClampStyle}
                                >
                                  {headlineText}
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                  {productUrl ? (
                                    <img
                                      src={productUrl}
                                      alt=""
                                      className={`w-auto object-contain ${productMaxHLargeClass}`}
                                    />
                                  ) : null}
                                  <div className="inline-flex px-3 py-1.5 text-xs font-medium bg-white/20 text-white border border-white/30">
                                    <span className="max-w-[24ch] truncate">{ctaText}</span>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {layoutPreset === "brutalist" ? (
                              <div
                                className={`absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-between ${verticalTextPadClass}`}
                              >
                                <div className="space-y-3">
                                  <div
                                    className="inline-block bg-black text-white px-3 py-2 text-4xl md:text-6xl font-black uppercase leading-none"
                                    style={twoLineClampStyle}
                                  >
                                    {headlineText}
                                  </div>
                                  <div
                                    className="inline-block bg-white text-black px-3 py-2 text-sm md:text-base font-bold"
                                    style={twoLineClampStyle}
                                  >
                                    {subheadlineText}
                                  </div>
                                </div>
                                <div className="flex items-end justify-between gap-4">
                                  <div className="inline-flex bg-black text-white px-4 py-2 text-sm font-bold uppercase">
                                    <span className="max-w-[20ch] truncate">{ctaText}</span>
                                  </div>
                                  {productUrl ? (
                                    <img
                                      src={productUrl}
                                      alt=""
                                      className={`w-auto object-contain ${productMaxHMediumClass}`}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {layoutPreset === "glass" ? (
                              <div
                                className={`absolute inset-0 z-10 flex items-center justify-center p-6 ${verticalTextPadClass} ${textTopBumpClass}`}
                              >
                                <div className="w-full max-w-[78%] rounded-2xl border border-white/30 bg-white/15 backdrop-blur-md px-6 py-7 text-center space-y-3">
                                  <div
                                    className="text-white text-4xl md:text-5xl font-semibold leading-tight"
                                    style={twoLineClampStyle}
                                  >
                                    {headlineText}
                                  </div>
                                  <div
                                    className="text-white/90 text-base md:text-lg"
                                    style={twoLineClampStyle}
                                  >
                                    {subheadlineText}
                                  </div>
                                  <div className="inline-flex rounded-full px-4 py-2 text-sm font-medium bg-white/90 text-black">
                                    <span className="max-w-[24ch] truncate">{ctaText}</span>
                                  </div>
                                </div>
                                {productUrl ? (
                                  <img
                                    src={productUrl}
                                    alt=""
                                    className={`absolute right-6 w-auto object-contain ${productMaxHSmallClass} ${productBottomClass}`}
                                  />
                                ) : null}
                              </div>
                            ) : null}

                            {layoutPreset === "hero" ? (
                              <>
                                <div
                                  className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 ${verticalTextPadClass} ${textTopBumpClass}`}
                                >
                                  <div
                                    className="text-white text-5xl md:text-6xl font-bold leading-[0.95] max-w-[90%]"
                                    style={twoLineClampStyle}
                                  >
                                    {headlineText}
                                  </div>
                                  <div
                                    className="text-white/90 text-lg md:text-xl mt-3 max-w-[80%]"
                                    style={twoLineClampStyle}
                                  >
                                    {subheadlineText}
                                  </div>
                                  <div className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-medium bg-white/90 text-black">
                                    <span className="max-w-[24ch] truncate">{ctaText}</span>
                                  </div>
                                </div>
                                {productUrl ? (
                                  <img
                                    src={productUrl}
                                    alt=""
                                    className={`absolute right-6 ${productHeroHClass} w-auto object-contain z-10 ${productBottomClass}`}
                                  />
                                ) : null}
                              </>
                            ) : null}

                            {safeSpec.builder.premiumOverlayUrls?.[0] ? (
                              <img
                                src={safeSpec.builder.premiumOverlayUrls[0]}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                              />
                            ) : null}
                          </div>
                        );
                      })()
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
              <div
                data-canvas-zoom-controls="true"
                className="absolute bottom-3 right-3 z-40 flex items-center gap-1 rounded-md border border-border/60 bg-background/90 p-1 text-[11px] backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => adjustZoomByStep(-1)}
                  className="rounded px-2 py-1 text-foreground hover:bg-muted"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={setZoom100}
                  className={[
                    "rounded px-2 py-1 tabular-nums",
                    Math.abs(canvasScale - 1) < 0.0001
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                  aria-label="Set zoom to 100%"
                >
                  {Math.round(canvasScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => adjustZoomByStep(1)}
                  className="rounded px-2 py-1 text-foreground hover:bg-muted"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={resetCanvasToFit}
                  className={[
                    "rounded px-2 py-1",
                    Math.abs(canvasScale - canvasFitScale) < 0.0001
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  Fit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEFT: INSPECTOR — order-1 to visually appear first */}
        {!focusMode && (
        <div className="min-h-0 border-r border-border/50 bg-card/30 hidden lg:flex flex-col order-1">
          <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("editor.inspector.title")}</div>
          </div>

          <div className={`px-4 py-3 ${sectionSpacing} overflow-auto flex-1`}>
            <div className={fieldSpacing}>
              <div className={sectionTitle}>{t("editor.subject.avatar_photo")}</div>
              <label className="w-full rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 flex items-center gap-3 cursor-pointer transition-all duration-150 hover:bg-muted/50 hover:border-border group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div>
                  <div className="text-xs font-medium text-foreground">{t("editor.subject.avatar_photo")}</div>
                  <div className="text-[10px] text-muted-foreground">Click or drag to upload</div>
                </div>
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
                      persistSpec({ ...safeSpec, subjectImageUrl: result });
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="sr-only"
                />
              </label>

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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("editor.references.title")}</div>
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
                        <div className="h-[72px] w-[72px] rounded-full border border-border overflow-hidden bg-muted shrink-0">
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
                          <label className="upload-zone text-xs">
                            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-foreground">Upload image</div>
                              <div className="text-[10px] text-muted-foreground">Click to replace</div>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
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
                            />
                          </label>
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
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[clampSize(Number(ref.weight ?? 70), 0, 100)]}
                            onValueChange={([val]) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? {
                                        ...item,
                                        weight: clampSize(val, 0, 100),
                                      }
                                    : item
                                ),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={Boolean(ref.lockRealism)}
                            onCheckedChange={(checked) =>
                              persistSpec({
                                ...safeSpec,
                                referenceImages: referenceImages.map((item) =>
                                  item.id === ref.id
                                    ? { ...item, lockRealism: Boolean(checked) }
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("social.platform_preset")}</div>
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

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.preset.label")}</label>
                  <Select
                    value={currentScenePreset}
                    onValueChange={(value) =>
                      persistSocialPostBuilderPatch({
                        scenePreset: normalizeScenePreset(value, "social_post"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("editor.scene.preset.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_PRESET_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(getScenePresetLabelKey(option))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.mood.label")}</label>
                  <Select
                    value={currentSceneMood}
                    onValueChange={(value) =>
                      persistSocialPostBuilderPatch({
                        sceneMood: normalizeSceneMood(value, "social_post"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("editor.scene.mood.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(getSceneMoodLabelKey(option))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.props.label")}</label>
                  <div className="rounded-md border border-border p-2 space-y-2">
                    <div className="text-[11px] text-muted-foreground">
                      {t("editor.scene.props.placeholder")}
                    </div>
                    {SCENE_PROP_OPTIONS.map((option) => {
                      const checked = currentSceneProps.includes(option);
                      return (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              const nextValues = checked
                                ? currentSceneProps.filter((item) => item !== option)
                                : [...currentSceneProps, option];
                              persistSocialPostBuilderPatch({
                                sceneProps: normalizeSceneProps(nextValues, "social_post"),
                              });
                            }}
                          />
                          {t(getScenePropLabelKey(option))}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("social.goal_use_case")}</div>
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("content")}</div>
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
                  <label className="upload-zone">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-foreground">{safeSpec.builder.logoUploads?.[0] ? "Logo uploaded" : t("logo_upload")}</div>
                      <div className="text-[10px] text-muted-foreground">Click to upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
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
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("product_upload")}</label>
                  <label className="upload-zone">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-foreground">{safeSpec.builder.productUploads?.[0] ? "Product uploaded" : t("product_upload")}</div>
                      <div className="text-[10px] text-muted-foreground">Click to upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
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
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {t("background_upload_optional")}
                  </label>
                  <label className="upload-zone">
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-foreground">{safeSpec.builder.backgroundUploads?.[0] ? "Background uploaded" : "Background"}</div>
                      <div className="text-[10px] text-muted-foreground">Click to upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
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
                  </label>
                </div>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("social.layout_preset")}</div>
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("social.visual_style")}</div>
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
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-xs text-muted-foreground">{t("accent_color")}</label>
                  <ColorPicker
                    value={safeSpec.brand.accent?.startsWith("#") ? safeSpec.brand.accent : "#34d399"}
                    onChange={(color) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, accent: color },
                      })
                    }
                  />
                </div>
              </div>
            ) : null}

            {isSocialPost ? (
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("social.premium_effects")}</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={Boolean(safeSpec.builder.premiumOverlayEnabled)}
                    onCheckedChange={(checked) =>
                      persistSocialPostBuilderPatch({ premiumOverlayEnabled: Boolean(checked) })
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
                        safeSpec.brand.accent || "#ffffff",
                        safeSpec.generation?.width ?? 1080,
                        safeSpec.generation?.height ?? 1080
                      );
                      persistSocialPostBuilderPatch({ premiumOverlayUrls: [overlay] });
                    }}
                >
                    {t("social.generate_overlay_assets")}
                  </Button>
                ) : null}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={Boolean(safeSpec.builder.designerMode)}
                    onCheckedChange={(checked) =>
                      persistSocialPostBuilderPatch({ designerMode: Boolean(checked) })
                    }
                  />
                  {t("social.designer_mode")}
                </label>
              </div>
            ) : null}

            {isPhotoshoot ? (
              <div className="pt-6 space-y-2">
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.subject.heading")}</div>
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.camera_lens.heading")}</div>

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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.light.heading")}</div>

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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.scene_props.heading")}</div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.preset.label")}</label>
                  <Select
                    value={currentScenePreset}
                    onValueChange={(value) =>
                      persistPhotoshootBuilderPatch({
                        scenePreset: normalizeScenePreset(value, "photoshoot"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("editor.scene.preset.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_PRESET_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(getScenePresetLabelKey(option))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.mood.label")}</label>
                  <Select
                    value={currentSceneMood}
                    onValueChange={(value) =>
                      persistPhotoshootBuilderPatch({
                        sceneMood: normalizeSceneMood(value, "photoshoot"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("editor.scene.mood.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(getSceneMoodLabelKey(option))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.props.label")}</label>
                  <div className="rounded-md border border-border p-2 space-y-2">
                    <div className="text-[11px] text-muted-foreground">
                      {t("editor.scene.props.placeholder")}
                    </div>
                    {SCENE_PROP_OPTIONS.map((option) => {
                      const checked = currentSceneProps.includes(option);
                      return (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              const nextValues = checked
                                ? currentSceneProps.filter((item) => item !== option)
                                : [...currentSceneProps, option];
                              persistPhotoshootBuilderPatch({
                                sceneProps: normalizeSceneProps(nextValues, "photoshoot"),
                              });
                            }}
                          />
                          {t(getScenePropLabelKey(option))}
                        </label>
                      );
                    })}
                  </div>
                </div>

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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.finish.heading")}</div>
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

            <div className="pt-6 space-y-3">
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
                {safeSpec.contextOpen ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
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

            {isEcom ? (
              <div className="pt-6 space-y-3">
                <label className="text-xs text-muted-foreground">{t("editor.scene.preset.label")}</label>
                <Select
                  value={currentScenePreset}
                  onValueChange={(value) =>
                    persistEcomBuilderPatch({
                      scenePreset: normalizeScenePreset(value, "ecom_banner"),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("editor.scene.preset.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENE_PRESET_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(getScenePresetLabelKey(option))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.mood.label")}</label>
                  <Select
                    value={currentSceneMood}
                    onValueChange={(value) =>
                      persistEcomBuilderPatch({
                        sceneMood: normalizeSceneMood(value, "ecom_banner"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("editor.scene.mood.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(getSceneMoodLabelKey(option))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("editor.scene.props.label")}</label>
                  <div className="rounded-md border border-border p-2 space-y-2">
                    <div className="text-[11px] text-muted-foreground">
                      {t("editor.scene.props.placeholder")}
                    </div>
                    {SCENE_PROP_OPTIONS.map((option) => {
                      const checked = currentSceneProps.includes(option);
                      return (
                        <label
                          key={option}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              const nextValues = checked
                                ? currentSceneProps.filter((item) => item !== option)
                                : [...currentSceneProps, option];
                              persistEcomBuilderPatch({
                                sceneProps: normalizeSceneProps(nextValues, "ecom_banner"),
                              });
                            }}
                          />
                          {t(getScenePropLabelKey(option))}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("editor.builder.title")}</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={Boolean(safeSpec.promptDebug)}
                    onCheckedChange={(checked) =>
                      persistSpec({
                        ...safeSpec,
                        promptDebug: Boolean(checked),
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
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[clampSize(Number(builder?.intensity ?? 70), 0, 100)]}
                  onValueChange={([val]) =>
                    persistSpec({
                      ...safeSpec,
                      builder: {
                        ...builder,
                        intensity: clampSize(val, 0, 100),
                      },
                    })
                  }
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
                  {t("editor.builder.advanced.label")} {builder?.advancedOpen ? <ChevronDown className="inline h-3 w-3" /> : <ChevronRight className="inline h-3 w-3" />}
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
              <div className="pt-6 space-y-3">
                <div className={sectionTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-px"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><path d="M12 22c5.5-2 8-7 8-12a8 8 0 0 0-16 0c0 5 2.5 10 8 12"/></svg>
                  {t("editor.palette.title")}
                </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-muted-foreground">{t("editor.palette.accent_primary")}</label>
                  <ColorPicker
                    value={safeSpec.brand.accent?.startsWith("#") ? safeSpec.brand.accent : "#34d399"}
                    onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, accent: color } })}
                  />
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-muted-foreground">{t("editor.palette.text")}</label>
                  <ColorPicker
                    value={safeSpec.brand.neutralText?.startsWith("#") ? safeSpec.brand.neutralText : "#ffffff"}
                    onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, neutralText: color } })}
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

              <div className="flex flex-wrap gap-3 items-center">
                {showSecondary ? (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <label className="text-[10px] text-muted-foreground">{t("editor.palette.secondary")}</label>
                    <ColorPicker
                      value={safeSpec.brand.secondary?.startsWith("#") ? safeSpec.brand.secondary : "#888888"}
                      onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, secondary: color } })}
                    />
                  </div>
                ) : null}
                {showAccent2 ? (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <label className="text-[10px] text-muted-foreground">{t("editor.palette.accent_2")}</label>
                    <ColorPicker
                      value={safeSpec.brand.accent2?.startsWith("#") ? safeSpec.brand.accent2 : "#888888"}
                      onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, accent2: color } })}
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-muted-foreground">{t("editor.palette.neutral_bg")}</label>
                  <ColorPicker
                    value={safeSpec.brand.neutralBg?.startsWith("#") ? safeSpec.brand.neutralBg : "#0f172a"}
                    onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, neutralBg: color } })}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-muted-foreground">{t("editor.palette.neutral_surface")}</label>
                  <ColorPicker
                    value={safeSpec.brand.neutralSurface?.startsWith("#") ? safeSpec.brand.neutralSurface : "#1e293b"}
                    onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, neutralSurface: color } })}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-muted-foreground">{t("editor.palette.neutral_text")}</label>
                  <ColorPicker
                    value={safeSpec.brand.neutralText?.startsWith("#") ? safeSpec.brand.neutralText : "#ffffff"}
                    onChange={(color) => persistSpec({ ...safeSpec, brand: { ...safeSpec.brand, neutralText: color } })}
                  />
                </div>
              </div>
              </div>
            ) : null}

            {/* TYPOGRAPHY */}
            {!isPhotoshoot && !isSocialPost ? (
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.typography.title")}</div>
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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.contrast.title")}</div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={Boolean(safeSpec.brand.autoContrast)}
                    onCheckedChange={(checked) =>
                      persistSpec({
                        ...safeSpec,
                        brand: { ...safeSpec.brand, autoContrast: Boolean(checked) },
                      })
                    }
                  />
                  {t("editor.contrast.auto")}
                </label>
              </div>
            ) : null}

            {/* STYLE PRESET */}
            {!isPhotoshoot && !isSocialPost ? (
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.typography.style_preset")}</div>

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
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("photoshoot.aspect_ratio.label")}</div>
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
            <div className="pt-6 space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.format.title")}</div>

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
              <Slider
                min={0}
                max={100}
                step={1}
                value={[clampSize(Number(safeSpec.generation.realism ?? 70), 0, 100)]}
                onValueChange={([val]) =>
                  persistSpec({
                    ...safeSpec,
                    generation: {
                      ...safeSpec.generation,
                      realism: clampSize(val, 0, 100),
                    },
                  })
                }
              />
            </div>

            {/* HISTORY */}
            <div className="pt-8 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.generic.history")}</div>

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
            <div className="pt-8 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/30">{t("editor.debug.compiled_title")}</div>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {compiled?.prompt}
              </pre>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {t("editor.debug.negative_prefix")} {compiled?.negativePrompt}
              </pre>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="px-4 md:px-6 py-2.5 border-t border-border bg-card flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {t("editor.actions.tip_generate_history")}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isBatchExporting || isExporting2K}
            onClick={() => void createVariations()}
          >
            {isBatchExporting
              ? t("editor.actions.exporting_10_progress", {
                  current: batchProgress?.current ?? 0,
                  total: batchProgress?.total ?? 10,
                })
              : t("editor.actions.create_10_variations")}
          </Button>
          <Button
            variant="outline"
            disabled={isBatchExporting || isExporting2K}
            onClick={() => void export2K()}
          >
            {isExporting2K ? t("editor.actions.exporting") : t("editor.actions.export_2k")}
          </Button>
        </div>
      </div>
      {isBatchExporting ? (
        <div className="px-4 md:px-6 pb-2 text-xs text-muted-foreground">
          {t("editor.actions.generating_variations_progress", {
            current: batchProgress?.current ?? 0,
            total: batchProgress?.total ?? 10,
          })}
        </div>
      ) : null}
      {lastExportError ? (
        <div className="px-4 md:px-6 pb-2 text-xs text-red-500">{lastExportError}</div>
      ) : null}
    </div>
  );
}
