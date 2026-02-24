// src/features/editor/spec-defaults.ts

import type {
  ModuleType,
  ProjectFormat,
  ProjectSpec,
  StylePreset,
  TemplateId,
  Project,
} from "@/types/spec";

const nowIso = () => new Date().toISOString();

export function moduleFromFormat(format: ProjectFormat): ModuleType {
  if (
    format === "feed_1080" ||
    format === "feed_1080x1350" ||
    format === "story_1080x1920" ||
    format === "landscape_1200x628"
  ) {
    return "social_post";
  }

  if (
    format === "ecom_desktop_1920x800" ||
    format === "ecom_notebook_1366x768" ||
    format === "ecom_mobile_1080x1350" ||
    format === "ecom_custom"
  ) {
    return "ecom";
  }

  return "photoshoot";
}

export function formatToSize(format: ProjectFormat): {
  aspectRatio: string;
  width: number;
  height: number;
} {
  switch (format) {
    // Social
    case "feed_1080":
      return { aspectRatio: "1:1", width: 1080, height: 1080 };
    case "feed_1080x1350":
      return { aspectRatio: "4:5", width: 1080, height: 1350 };
    case "story_1080x1920":
      return { aspectRatio: "9:16", width: 1080, height: 1920 };
    case "landscape_1200x628":
      return { aspectRatio: "1.91:1", width: 1200, height: 628 };

    // Ecom
    case "ecom_desktop_1920x800":
      return { aspectRatio: "12:5", width: 1920, height: 800 };
    case "ecom_notebook_1366x768":
      return { aspectRatio: "1366:768", width: 1366, height: 768 };
    case "ecom_mobile_1080x1350":
      return { aspectRatio: "4:5", width: 1080, height: 1350 };
    case "ecom_custom":
      // default custom size (você pode trocar depois por settings do usuário)
      return { aspectRatio: "12:5", width: 1920, height: 800 };

    // Photoshoot
    case "square_1024":
      return { aspectRatio: "1:1", width: 1024, height: 1024 };

    default: {
      // fallback ultra-seguro
      return { aspectRatio: "1:1", width: 1024, height: 1024 };
    }
  }
}

export function defaultTemplateFor(module: ModuleType): TemplateId {
  switch (module) {
    case "social":
      return "social_01";
    case "social_post":
      return "social_post_clean";
    case "ecom":
      return "ecom_01";
    case "photoshoot":
      return "photoshoot_clean";
  }
}

export function defaultStyleFor(module: ModuleType): StylePreset {
  switch (module) {
    case "social":
      return "bold_ads";
    case "social_post":
      return "clean_modern";
    case "ecom":
      return "minimal_clean";
    case "photoshoot":
      return "editorial";
  }
}

export function createDefaultSpec(format: ProjectFormat): ProjectSpec {
  const module = moduleFromFormat(format);
  const size = formatToSize(format);
  const isPhotoshoot = module === "photoshoot";
  const isSocialPost = module === "social_post";

  return {
    module,
    format,
    photoAspect: isPhotoshoot ? "3:2" : undefined,
    stylePreset: defaultStyleFor(module),
    templateId: defaultTemplateFor(module),
    contextText: "",
    subjectText: "",
    styleText: "",
    cameraText: "",
    compositionText: "",
    subjectImageUrl: null,
    contextOpen: false,
    lightingText: "",
    assetsText: "",
    promptDebug: false,
    builder: {
      platformPreset: isSocialPost ? "instagram_feed" : "",
      goalPreset: isSocialPost ? "Offer" : "",
      layoutPreset: isSocialPost ? "Hero" : "",
      compositionFlags: isSocialPost ? [] : [],
      headline: "",
      subheadline: "",
      cta: "",
      badge: "",
      brandName: "",
      logoUploads: [],
      productUploads: [],
      backgroundUploads: [],
      premiumOverlayEnabled: false,
      premiumOverlayUrls: [],
      designerMode: false,
      batchCount: isPhotoshoot ? 4 : 1,
      intensity: isPhotoshoot ? 55 : 70,
      finish: isPhotoshoot ? "true_to_life" : "",
      subjectType: isPhotoshoot ? "person" : "",
      framing: isPhotoshoot ? "medium_shot" : "",
      expression: "",
      action: "",
      lightingSetup: "",
      temperature: "",
      mood: "",
      macroStyle: isPhotoshoot ? "editorial" : isSocialPost ? "clean_modern" : "",
      visualStyle: [],
      assetsHighlights: [],
      contextProps: [],
      materialFeel: "",
      lens: isPhotoshoot ? "85mm" : "",
      depth: isPhotoshoot ? "strong_bokeh" : "",
      angle: "",
      motion: isPhotoshoot ? "static" : "",
      advancedOpen: false,
      layoutBase: "",
      safeSpace: "",
      extraDetails: "",
    },
    referenceImages: [],
    referenceImageUrl: null,

    content: {
      headline: module === "ecom" ? "New Collection" : "Your Next Big Win",
      subheadline:
        module === "photoshoot"
          ? "Ultra-clean, studio-grade outputs."
          : "High-performing creatives in minutes.",
      ctaText: module === "ecom" ? "Shop now" : "Learn more",
      price: module === "ecom" ? "$49" : undefined,
      badgeText: module === "social" ? "NEW" : undefined,
    },

    brand: {
      primary: "#ffffff",
      secondary: "#0b0f14",
      accent: "#34d399",
      paletteMode: "mono",
      accent2: "#888888",
      neutralBg: "#0f172a",
      neutralSurface: "#1e293b",
      neutralText: "#ffffff",
      accentMode: "gradient",
      fontPreset: "space_grotesk",
      autoContrast: true,
      logoUrl: undefined,
    },

    assets: {
      productImageUrl: undefined,
      extraImageUrl: undefined,
      referenceImageUrl: undefined,
      autoRemoveBg: false,
    },

    effects: {
      preset: module === "photoshoot" ? "clean" : "bold",
      textOutline: module === "social" ? 6 : 2,
      shadow: module === "social" ? 6 : 3,
      depth3d: module === "social" ? 2 : 0,
      tilt: 0,
    },

    generation: {
      aspectRatio: size.aspectRatio,
      width: size.width,
      height: size.height,
      quality: "high",
      realism: 70,
    },
  };
}

export function createMockProject(name: string, format: ProjectFormat): Project {
  return {
    id: crypto.randomUUID(),
    name,
    spec: createDefaultSpec(format),
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}
