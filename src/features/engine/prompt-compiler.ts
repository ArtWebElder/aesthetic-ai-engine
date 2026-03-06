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


const TEXT_POSITION_INSTRUCTIONS: Record<string, string> = {
  top:    "Keep upper 35% of frame dark and visually clean for text overlay. Subject must be placed in lower 2/3 of the frame.",
  bottom: "Keep lower 35% of frame dark and visually clean for text overlay. Subject must be placed in upper 2/3 of the frame.",
  left:   "Keep left 45% of frame dark and visually clean for text overlay. Subject must be right-aligned in the frame.",
  right:  "Keep right 45% of frame dark and visually clean for text overlay. Subject must be left-aligned in the frame.",
  over:   "Subject centered. Ensure the subject area has contrast variation — dark and light zones — so text can be readable over it.",
};

/** Returns composition instruction for text safe area.
 *  Uses builder.safeSpace if set, falls back to per-module default. */
function resolveTextPosition(safeSpace: string | undefined, module: string): string {
  const key = safeSpace?.trim().toLowerCase();
  if (key && TEXT_POSITION_INSTRUCTIONS[key]) {
    return TEXT_POSITION_INSTRUCTIONS[key];
  }
  // Per-module defaults
  if (module === "ecom_banner") return TEXT_POSITION_INSTRUCTIONS["bottom"];
  return TEXT_POSITION_INSTRUCTIONS["bottom"];
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
  // When text content is provided, the AI integrates it into the image (Stage 4b IA-first).
  // When no text: reserve a clean safe area for the empty composition.
  const hasText = Boolean(headline?.trim() || subheadline?.trim() || cta?.trim());

  const typographyBlock = (() => {
    if (module === "photoshoot") return null;

    if (hasText) {
      const textPosition = resolveTextPosition(safeSpace, module);
      const lines: string[] = [
        "TYPOGRAPHY (integrated into the image — part of the scene, not an overlay):",
      ];
      if (headline?.trim()) lines.push(`Headline: "${headline.trim()}" — large, bold, dominant typeface, high contrast against background.`);
      if (subheadline?.trim()) lines.push(`Subheadline: "${subheadline.trim()}" — medium weight, legible, secondary hierarchy.`);
      if (cta?.trim()) lines.push(`CTA: "${cta.trim()}" — button-style or strong callout treatment.`);
      lines.push(
        `Text placement: ${textPosition}`,
        "Render the text with texture, ambient lighting blend, and depth consistent with the scene. The typography must feel painted into the scene — not floating on top.",
        "Letterforms must be sharp, correctly spelled, and readable."
      );
      return lines.join(" ");
    }

    // No text — reserve compositional space
    return `TEXT SAFE AREA: No text in the image. ${resolveTextPosition(safeSpace, module)} Keep this zone visually clean with low complexity for future text overlay.`;
  })();

  // ── [QUALITY_BLOCK] ───────────────────────────────────────────────────────
  const qualityParts: string[] = [
    "QUALITY REQUIREMENTS: No plastic skin. No dead eyes. No distorted hands or extra fingers. Anatomically correct proportions.",
    "Consistent lighting — the light direction on the subject must match the scene light source. No contradictory dual lighting.",
    "No white halo or edge fringe around the subject. No JPEG artifacts. No pixelation. No over-compression.",
    "No watermarks. No logos from other tools.",
    !hasText ? "No text, no letters, no words, no numbers anywhere in the image." : null,
    "Print-ready quality. The result must be directly usable in a paid advertising campaign without any additional editing.",
  ];

  const qualityBlock = qualityParts.filter(Boolean).join(" ");

  // ── Assemble full prompt ──────────────────────────────────────────────────
  const colorBlock = buildColorPaletteInstruction(brand, module) || null;
  const prompt = [colorBlock, styleBlock, subjectBlock, sceneBlock, typographyBlock, qualityBlock]
    .filter(Boolean)
    .join("\n\n");

  // ── Negative prompt ───────────────────────────────────────────────────────
  const coreNegative = [
    "plastic skin, waxy face, dead eyes, distorted hands, extra fingers, wrong anatomy, disfigured body",
    "stock photo generic background, inconsistent lighting, two suns, dual contradictory light sources",
    "white halo around subject, edge fringe, cutout artifact, JPEG noise, pixelated, over-compressed",
    "watermark, tool logo, brand logo overlay, copyright stamp",
    module !== "photoshoot" && !hasText
      ? "text, letters, words, numbers, typography, headline, label, caption, subtitle, watermark text, any written characters"
      : "watermark, tool logo overlay, copyright stamp, unintended random text artifacts",
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
