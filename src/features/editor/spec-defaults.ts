// src/features/editor/spec-defaults.ts

import type {
  ModuleType,
  ProjectFormat,
  ProjectSpec,
  StylePreset,
  TemplateId,
} from "@/types/spec";

const nowIso = () => new Date().toISOString();

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

    // Ecom (novo)
    case "ecom_ultrawide_1920x800":
      return { aspectRatio: "12:5", width: 1920, height: 800 };
    case "ecom_notebook_1366x768":
      return { aspectRatio: "1366:768", width: 1366, height: 768 };
    case "ecom_mobile_1080x1350":
      return { aspectRatio: "4:5", width: 1080, height: 1350 };
    case "ecom_custom":
      return { aspectRatio: "12:5", width: 1920, height: 800 };

    // Photoshoot
    case "square_1024":
      return { aspectRatio: "1:1", width: 1024, height: 1024 };
  }
}

export function defaultTemplateFor(module: ModuleType): TemplateId {
  switch (module) {
    case "social":
      return "social_01";
    case "ecom":
      return "ecom_01";
    case "photoshoot":
      return "photo_01";
  }
}

export function defaultStyleFor(module: ModuleType): StylePreset {
  switch (module) {
    case "social":
      return "bold_ads";
    case "ecom":
      return "minimal_clean";
    case "photoshoot":
      return "editorial";
  }
}

export function createDefaultSpec(format: ProjectFormat): ProjectSpec {
  const module = moduleFromFormat(format);
  const size = formatToSize(format);

  return {
    module,
    format,
    stylePreset: defaultStyleFor(module),
    templateId: defaultTemplateFor(module),

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
    },
  };
}

// Optional helper: build a mock Project object quickly
export function createMockProject(name: string, format: ProjectFormat) {
  return {
    id: crypto.randomUUID(),
    name,
    spec: createDefaultSpec(format),
    status: "draft" as const,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}