// src/features/engine/prompt-compiler.ts

import type { ProjectSpec } from "@/types/spec";
import {
  ACTION_OPTIONS,
  ANGLE_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  LENS_OPTIONS,
  LIGHTING_SETUP_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
} from "@/features/editor/editor-presets";
import { getScenePresetDescription } from "@/features/editor/scene-presets";
import { getSceneMoodDescription } from "@/features/editor/scene-moods";
import { getScenePropDescription } from "@/features/editor/scene-props";

export interface CompiledPrompt {
  prompt: string;
  negativePrompt: string;
  meta: {
    stylePreset: string;
    aspectRatio: string;
    size: { w: number; h: number };
    module: ProjectSpec["module"];
    format: ProjectSpec["format"];
    usedNegativePrompt?: boolean;
    usedSeed?: boolean;
    defaultNegativePromptWasApplied?: boolean;
  };
}

type MoodTier = "drama_impact" | "clean_premium" | "dark_cinematic" | "neutral";

type PaletteMode = "mono" | "duo" | "tri" | "custom";

/** Builds a mandatory color-palette block to be placed at the START of the prompt.
 *  Uses imperative language so the model cannot ignore the palette. */
function buildColorPaletteInstruction(
  brand: ProjectSpec["brand"],
  module: string
): string {
  if (module === "photoshoot") return "";

  const mode: PaletteMode = (brand.paletteMode as PaletteMode) ?? "duo";
  const parts: string[] = [];

  const isValid = (v?: string) => v && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());

  if (isValid(brand.primary)) {
    parts.push(
      `Primary color: ${brand.primary} — MUST be used for dominant background, main surfaces, and overall atmosphere.`
    );
  }

  if (mode !== "mono" && isValid(brand.accent)) {
    parts.push(
      `Accent color: ${brand.accent} — MUST be used for rim lighting, neon glow, particle effects, energy sources, and focal highlights.`
    );
  }

  if ((mode === "tri" || mode === "custom") && isValid(brand.secondary)) {
    parts.push(
      `Secondary color: ${brand.secondary} — use for supporting fills, shadow mid-tones, and secondary surfaces.`
    );
  }

  if (mode === "custom" && isValid(brand.neutralBg)) {
    parts.push(`Neutral background: ${brand.neutralBg} — use for background depth and ambient fills.`);
  }

  if (parts.length === 0) return "";
  return `COLOR PALETTE (MANDATORY — non-negotiable): ${parts.join(" ")} The dominant visual atmosphere of the entire image MUST reflect these colors. This is a hard requirement.`;
}

function getMoodTier(mood: string): MoodTier {
  if (mood === "cinematic_moody" || mood === "energetic_pop") return "drama_impact";
  if (mood === "luxury_premium" || mood === "clean_bright") return "clean_premium";
  if (mood === "night_neon" || mood === "cool_modern") return "dark_cinematic";
  return "neutral";
}

function getTypographyStyle(moodTier: MoodTier): string {
  switch (moodTier) {
    case "drama_impact":
      return "bold display typeface with metallic grunge texture integrated into the image; headline accent word in vivid accent color (purple, orange, or cyan); text interacts with scene rim lighting and particles; letterforms cast visible shadows in the scene";
    case "clean_premium":
      return "bold geometric sans-serif, clean and sharp; black or white letterforms with high legibility; left-aligned hierarchy; CTA styled as an outline button element integrated into the scene composition";
    case "dark_cinematic":
      return "gothic or heavy serif typeface in pure white or metallic gold/silver; letterforms with subtle glow or inner light consistent with the scene neon/cold lighting; title positioned at upper area, credits/CTA at base";
    default:
      return "professional bold sans-serif; high contrast against background; clean legible letterforms consistent with the scene atmosphere";
  }
}


const TEXT_POSITION_LABELS: Record<string, string> = {
  top:    "upper third of the frame",
  bottom: "lower third of the frame",
  left:   "left side of the frame",
  right:  "right side of the frame",
  over:   "centered over the subject",
};

const TEXT_COMPOSITION_ZONE: Record<string, string> = {
  top:    "Subject placed in lower 2/3 of frame; upper third has atmospheric depth for text integration.",
  bottom: "Subject placed in upper 2/3 of frame; lower third has atmospheric depth for text integration.",
  left:   "Subject right-aligned; left side has atmospheric depth for text integration.",
  right:  "Subject left-aligned; right side has atmospheric depth for text integration.",
  over:   "Subject centered with contrast variation — dark and light zones — so text integrates naturally over it.",
};

/** Returns text position label and composition zone instruction.
 *  Uses builder.safeSpace if set, falls back to per-module default. */
function resolveTextPosition(safeSpace: string | undefined, module: string): { label: string; zone: string } {
  const key = safeSpace?.trim().toLowerCase();
  if (key && TEXT_POSITION_LABELS[key]) {
    return { label: TEXT_POSITION_LABELS[key], zone: TEXT_COMPOSITION_ZONE[key] };
  }
  // Per-module defaults
  if (module === "ecom_banner") return { label: TEXT_POSITION_LABELS["bottom"], zone: TEXT_COMPOSITION_ZONE["bottom"] };
  return { label: TEXT_POSITION_LABELS["bottom"], zone: TEXT_COMPOSITION_ZONE["bottom"] };
}

function toLabel(value: string, options: Array<{ value: string; label: string }>): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

export function compilePrompt(spec: ProjectSpec): CompiledPrompt {
  const {
    module,
    stylePreset,
    content,
    brand,
    generation,
    contextText,
    subjectText,
    subjectImageUrl,
    promptDebug,
    builder,
    referenceImages,
    referenceImageUrl,
  } = spec;

  const { headline, subheadline, ctaText: cta } = content;
  const userNegativePrompt =
    typeof generation.negativePrompt === "string" ? generation.negativePrompt.trim() : "";
  const normalizedSeed =
    Number.isFinite(Number(generation.seed)) && generation.seed !== null
      ? Math.max(0, Math.min(2_147_483_647, Math.round(Number(generation.seed))))
      : null;

  const intensity =
    typeof builder?.intensity === "number"
      ? Math.max(0, Math.min(100, Math.round(builder.intensity)))
      : 70;

  // Builder field values
  const scenePreset = builder?.scenePreset?.trim() ?? "";
  const sceneMood = builder?.sceneMood?.trim() ?? "";
  const sceneProps = Array.isArray(builder?.sceneProps) ? builder.sceneProps : [];
  const subjectTypeVal = builder?.subjectType?.trim() ?? "";
  const framingVal = builder?.framing?.trim() ?? "";
  const expressionVal = builder?.expression?.trim() ?? "";
  const actionVal = builder?.action?.trim() ?? "";
  const lightingSetupVal = builder?.lightingSetup?.trim() ?? "";
  const lensVal = builder?.lens?.trim() ?? "";
  const angleVal = builder?.angle?.trim() ?? "";
  const extraDetails = builder?.extraDetails?.trim() ?? "";
  const safeSpace = builder?.safeSpace?.trim() ?? "";

  // Convert enum values to readable labels
  const subjectTypeLabel = subjectTypeVal
    ? toLabel(subjectTypeVal, SUBJECT_TYPE_OPTIONS)
    : "";
  const framingLabel = framingVal ? toLabel(framingVal, FRAMING_OPTIONS) : "";
  const expressionLabel = expressionVal ? toLabel(expressionVal, EXPRESSION_OPTIONS) : "";
  const actionLabel = actionVal ? toLabel(actionVal, ACTION_OPTIONS) : "";
  const lightingLabel = lightingSetupVal
    ? toLabel(lightingSetupVal, LIGHTING_SETUP_OPTIONS)
    : "";
  const lensLabel = lensVal ? toLabel(lensVal, LENS_OPTIONS) : "";
  const angleLabel = angleVal ? toLabel(angleVal, ANGLE_OPTIONS) : "";

  // Scene descriptions
  const scenePresetDescription = getScenePresetDescription(scenePreset);
  const sceneMoodDescription = getSceneMoodDescription(sceneMood);
  const scenePropsDescriptions = sceneProps
    .map((value) => getScenePropDescription(value))
    .filter((value): value is string => Boolean(value));

  const moodTier = getMoodTier(sceneMood);
  const cleanedContext = contextText?.trim();
  const cleanedSubject = subjectText?.trim();
  const hasSubjectRef = Boolean(subjectImageUrl?.trim());

  // Reference images
  const cleanedReferenceImage = referenceImageUrl?.trim();
  const normalizedReferences = (referenceImages ?? [])
    .filter((entry) => Boolean(entry?.url) && !String(entry?.url).trim().startsWith("data:"))
    .map((entry) => ({
      role: entry.role ?? "style",
      weight:
        typeof entry.weight === "number"
          ? Math.max(0, Math.min(100, Math.round(entry.weight)))
          : 70,
      url: entry.url?.trim() ?? "",
      notes: entry.notes?.trim() ?? "",
    }));
  if (normalizedReferences.length === 0 && cleanedReferenceImage) {
    normalizedReferences.push({
      role: "style",
      weight: 70,
      url: cleanedReferenceImage,
      notes: "",
    });
  }

  // ── [STYLE_BLOCK] ─────────────────────────────────────────────────────────
  const moduleLabel =
    module === "social_post"
      ? "social media marketing creative"
      : module === "ecom_banner"
      ? "e-commerce promotional banner"
      : "professional editorial photoshoot";

  const intensityLabel =
    intensity >= 85
      ? "visually dominant, cinematically striking, bold composition"
      : intensity >= 70
      ? "strong visual impact, high-quality commercial feel"
      : "clean and refined, subtle and professional";

  const tierLabel =
    moodTier === "drama_impact"
      ? "DRAMA / IMPACT — high contrast, dramatic atmosphere, bold visual energy"
      : moodTier === "clean_premium"
      ? "CLEAN / PREMIUM — refined editorial, minimal elegance, professional clarity"
      : moodTier === "dark_cinematic"
      ? "DARK / CINEMATIC — moody, immersive depth, cinematic atmosphere"
      : "professional commercial — sharp, clean, direct";

  const styleBlock = `Photorealistic cinematic ${moduleLabel}. Professional marketing creative, agency quality. Ultra-detailed, 8K resolution equivalent. Visual intensity: ${intensityLabel}. Style direction: ${tierLabel}.`;

  // ── [SUBJECT_BLOCK] ───────────────────────────────────────────────────────
  const subjectDescParts: string[] = [];
  if (cleanedSubject) subjectDescParts.push(cleanedSubject);
  if (subjectTypeLabel) subjectDescParts.push(subjectTypeLabel);
  if (framingLabel) subjectDescParts.push(`framing: ${framingLabel}`);
  if (expressionLabel) subjectDescParts.push(`expression: ${expressionLabel}`);
  if (actionLabel) subjectDescParts.push(`action: ${actionLabel}`);
  if (angleLabel) subjectDescParts.push(`angle: ${angleLabel}`);
  if (lensLabel) subjectDescParts.push(`lens: ${lensLabel}`);

  const identityLine =
    hasSubjectRef || generation.strictIdentity
      ? "Strict identity preservation — exact likeness, do not drift, do not reimagine or replace."
      : "";

  const subjectBlock =
    subjectDescParts.length > 0 || identityLine
      ? [
          "SUBJECT:",
          subjectDescParts.length > 0 ? subjectDescParts.join(", ") + "." : null,
          identityLine || null,
          "Sharp focus on subject. No overprocessing. No plastic skin. No dead eyes.",
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  // ── [SCENE_BLOCK] ─────────────────────────────────────────────────────────
  const sceneParts: string[] = ["SCENE:"];
  if (scenePresetDescription) sceneParts.push(scenePresetDescription + ".");
  if (sceneMoodDescription) sceneParts.push(sceneMoodDescription + ".");
  if (lightingLabel) sceneParts.push(`Lighting setup: ${lightingLabel}.`);
  if (scenePropsDescriptions.length > 0) {
    sceneParts.push(scenePropsDescriptions.join(". ") + ".");
  }
  if (cleanedContext)
    sceneParts.push(
      `CAMPAIGN INTENT: ${cleanedContext}. Adapt the mood, atmosphere, props, and scene composition to reflect this intent.`
    );
  if (extraDetails)
    sceneParts.push(
      `VISUAL DIRECTIVES: ${extraDetails}. These are specific visual requirements — include them exactly.`
    );

  if (normalizedReferences.length > 0) {
    const ref = normalizedReferences[0];
    const roleGuidance =
      ref.role === "style"
        ? "visual style, lighting, color grading and textures"
        : ref.role === "product"
        ? "product fidelity (shape, details, materials)"
        : ref.role === "brand"
        ? "brand identity (palette, tone, consistency)"
        : "general visual reference";
    sceneParts.push(
      `Reference image attached: use for ${roleGuidance}. Weight: ${ref.weight}/100.`
    );
  }

  const sceneBlock = sceneParts.length > 1 ? sceneParts.join(" ") : null;

  // ── [TYPOGRAPHY_BLOCK] ────────────────────────────────────────────────────
  // IA-first approach: when headline is provided, the AI INTEGRATES typography
  // directly into the image. Text is part of the scene — NOT pasted on top.
  const typographyBlock = (() => {
    if (module === "photoshoot") return null;
    const { label: posLabel, zone: posZone } = resolveTextPosition(safeSpace, module);
    const cleanHeadline = headline?.trim() ?? "";
    const cleanSubheadline = subheadline?.trim() ?? "";
    const cleanCta = (content.ctaText ?? builder?.cta ?? "").trim();

    if (!cleanHeadline) {
      // No text to render — only give compositional guidance, do NOT block text generation
      return `COMPOSITION: ${posZone} Leave balanced negative space in the scene for breathing room. No forced text elements needed.`;
    }

    const typographyStyle = getTypographyStyle(moodTier);
    const parts = [
      `TYPOGRAPHY (integrated into the scene, NOT pasted on top):`,
      `Headline: "${cleanHeadline}" — ${typographyStyle}.`,
      cleanSubheadline ? `Subheadline: "${cleanSubheadline}" — smaller, lighter weight, secondary hierarchy.` : null,
      cleanCta ? `CTA: "${cleanCta}" — styled as a button or accent text element.` : null,
      `Positioned at ${posLabel}. ${posZone}`,
      `All text MUST be correctly spelled, fully legible, properly kerned, and visually integrated with the scene lighting and atmosphere.`,
      `Typography is part of the image — letterforms interact with light, shadow, and environment. Not a flat overlay.`,
    ].filter(Boolean).join(" ");

    return parts;
  })();

  // ── [QUALITY_BLOCK] ───────────────────────────────────────────────────────
  const hasHeadlineText = Boolean((headline?.trim() ?? "") && module !== "photoshoot");
  const qualityParts: string[] = [
    "QUALITY REQUIREMENTS: No plastic skin. No dead eyes. No distorted hands or extra fingers. Anatomically correct proportions.",
    "Consistent lighting — the light direction on the subject must match the scene light source. No contradictory dual lighting.",
    "No white halo or edge fringe around the subject. No JPEG artifacts. No pixelation. No over-compression.",
    "No watermarks. No logos from other tools.",
    hasHeadlineText
      ? "All text in the image must be correctly spelled, fully legible, and properly integrated with the scene. No garbled letters. No placeholder text."
      : module !== "photoshoot"
      ? "No random text, letters, words, or numbers in the image unless explicitly specified above."
      : null,
    "Print-ready quality. The result must be directly usable in a paid advertising campaign without any additional editing.",
  ];

  const qualityBlock = qualityParts.filter(Boolean).join(" ");

  // ── Assemble full prompt ──────────────────────────────────────────────────
  const colorBlock = buildColorPaletteInstruction(brand, module) || null;
  const prompt = [colorBlock, styleBlock, subjectBlock, sceneBlock, typographyBlock, qualityBlock]
    .filter(Boolean)
    .join("\n\n");

  // ── Negative prompt ───────────────────────────────────────────────────────
  // When headline is provided, we DON'T block text — the AI integrates typography.
  // When no headline, we block unintended text generation.
  const textNegative = hasHeadlineText
    ? "garbled text, misspelled words, illegible letters, Lorem ipsum, placeholder text, watermark"
    : "text, letters, words, numbers, typography, watermark, written text, captions, labels, signs, any writing";

  const coreNegative = [
    textNegative,
    "plastic skin, waxy face, dead eyes, distorted hands, extra fingers, wrong anatomy, disfigured body",
    "stock photo generic background, inconsistent lighting, two suns, dual contradictory light sources",
    "white halo around subject, edge fringe, cutout artifact, JPEG noise, pixelated, over-compressed",
    "watermark, tool logo, brand logo overlay, copyright stamp",
    module === "ecom_banner" ? "wrong product category, unrelated object, replaced product" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const finalNegativePrompt = userNegativePrompt
    ? `${coreNegative}, ${userNegativePrompt}`
    : coreNegative;

  const defaultNegativePromptWasApplied = !userNegativePrompt;

  return {
    prompt,
    negativePrompt: finalNegativePrompt,
    meta: {
      stylePreset: stylePreset ?? "",
      aspectRatio: generation.aspectRatio,
      size: { w: generation.width, h: generation.height },
      module,
      format: spec.format,
      usedNegativePrompt: promptDebug ? Boolean(finalNegativePrompt) : undefined,
      usedSeed: promptDebug ? normalizedSeed !== null : undefined,
      defaultNegativePromptWasApplied: promptDebug ? defaultNegativePromptWasApplied : undefined,
    },
  };
}
