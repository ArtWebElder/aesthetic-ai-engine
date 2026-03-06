/// <reference lib="deno.ns" />

// =============================================================================
// CREATYNG — VISION FIRST STAGE 2: Smart Prompt Compiler (DIFF VF.3)
// Compila VisualDNA + UserIntent → prompt estruturado em 5 blocos.
// VisualDNA é fonte primária; preset/tier é fallback quando DNA ausente.
// =============================================================================

import type {
  VisualDNA,
  SubjectProfile,
  UserIntent,
  CompositionConfig,
  SmartCompiledPrompt,
  PromptBlocks,
} from "./types.ts";

// ── Tier system (mesmo mapeamento do frontend prompt-compiler.ts) ─────────────

type MoodTier = "drama_impact" | "clean_premium" | "dark_cinematic" | "neutral";

function getMoodTier(preset: string): MoodTier {
  if (preset === "drama" || preset === "cinematic_moody" || preset === "energetic_pop") return "drama_impact";
  if (preset === "clean" || preset === "luxury_premium" || preset === "clean_bright") return "clean_premium";
  if (preset === "dark" || preset === "night_neon" || preset === "cool_modern") return "dark_cinematic";
  return "neutral";
}

// ── Fallback recipes (usados quando DNA ausente) ──────────────────────────────

function getTierLightingRecipe(tier: MoodTier): string {
  switch (tier) {
    case "drama_impact":
      return "3-point lighting: soft frontal key light, intense purple/magenta rim light from behind creating a glowing halo, dark fill side with deep shadows. Aggressive background bokeh f/1.4. Airborne particles (sparks, glowing embers). High contrast, deep blacks, saturated highlights, cinematic color grading.";
    case "clean_premium":
      return "Soft diffused natural window light, even flat illumination, near-white or cool gray neutral background, minimal hard shadows. High-end architectural studio feel. Intentional negative space. Refined editorial minimal elegance.";
    case "dark_cinematic":
      return "Cold frontal key light with cyan/blue color cast, intense rim light from behind, deep black background suggesting a tunnel or corridor with receding depth. Volumetric fog, god rays cutting through darkness. Floating 3D glass prisms and crystal fragments refracting light. Monochromatic cyan-black palette.";
    default:
      return "Professional balanced lighting, clean direct composition, sharp details.";
  }
}

function getTierColorPalette(tier: MoodTier): string {
  switch (tier) {
    case "drama_impact":
      return "Deep blacks and saturated mid-tones. Dominant dark background. Purple/magenta rim light accent (#7B2FFF or #FF00DD). Orange/amber fill warmth.";
    case "clean_premium":
      return "Near-white (#F8F8F8) or cool light gray background. Minimal color variation. Clean neutral tones.";
    case "dark_cinematic":
      return "Monochromatic cyan-black. Primary: near-black (#080C10). Accent: electric cyan (#00E5FF) or blue-white.";
    default:
      return "Balanced commercial palette. Clean background. High contrast on subject.";
  }
}

// ── DNA → lighting block ──────────────────────────────────────────────────────

function buildLightingFromDNA(dna: VisualDNA): string {
  const parts: string[] = [];
  const l = dna.lighting;

  parts.push(`${l.type} lighting, direction: ${l.direction}.`);
  if (l.color) parts.push(`Key light color: ${l.color}.`);
  if (l.rimColor) parts.push(`Rim light: ${l.rimColor}.`);
  parts.push(`Intensity: ${l.intensity}. Shadows: ${l.shadows}.`);

  const a = dna.atmosphere;
  if (a.particles && a.particleType) parts.push(`Airborne particles: ${a.particleType}.`);
  if (a.fog) parts.push("Volumetric fog present.");
  if (a.glowEffects) parts.push("Glow effects on subject and environment.");
  if (a.depthOfField !== "none") parts.push(`Depth of field: ${a.depthOfField}.`);
  parts.push(`Overall mood: ${a.mood}.`);

  return parts.join(" ");
}

function buildColorFromDNA(dna: VisualDNA, userColors?: UserIntent["colors"]): string {
  const parts: string[] = [];

  if (userColors?.primary && /^#[0-9a-fA-F]{3,8}$/.test(userColors.primary.trim())) {
    parts.push(`Primary color: ${userColors.primary} (MANDATORY — dominant background and surfaces).`);
  } else if (dna.colorPalette.dominant) {
    parts.push(`Dominant color: ${dna.colorPalette.dominant}.`);
  }

  if (userColors?.secondary && /^#[0-9a-fA-F]{3,8}$/.test(userColors.secondary.trim())) {
    parts.push(`Accent/secondary: ${userColors.secondary} (rim lighting, focal highlights).`);
  } else if (dna.colorPalette.accent) {
    parts.push(`Accent color: ${dna.colorPalette.accent} (rim light, glow, highlights).`);
  }

  if (dna.colorPalette.background) parts.push(`Background tone: ${dna.colorPalette.background}.`);
  if (dna.colorPalette.overall) parts.push(`Color mood: ${dna.colorPalette.overall}.`);

  return parts.join(" ");
}

function buildCompositionFromDNA(dna: VisualDNA, config: CompositionConfig): string {
  const c = dna.composition;
  const parts: string[] = [];

  parts.push(`Subject position: ${c.subjectPosition}.`);
  parts.push(`Camera angle: ${c.cameraAngle}.`);
  if (c.foregroundElements) parts.push(`Foreground: ${c.foregroundElements}.`);
  if (c.backgroundElements) parts.push(`Background: ${c.backgroundElements}.`);
  if (c.planes > 1) parts.push(`${c.planes} depth planes visible.`);

  // Override composition for text safe zone
  const textZoneInstruction = resolveTextZone(config.textPosition, config.aspectRatio);
  parts.push(textZoneInstruction);

  return parts.join(" ");
}

function buildSpecialElementsFromDNA(dna: VisualDNA): string {
  const parts: string[] = [];
  const s = dna.specialElements;

  if (s.effects3D && s.effects3DDescription) {
    parts.push(`3D elements: ${s.effects3DDescription}.`);
  }
  if (s.energyEffects && s.energyDescription) {
    parts.push(`Energy effects: ${s.energyDescription}.`);
  }
  if (s.environmentalElements) {
    parts.push(`Environment: ${s.environmentalElements}.`);
  }
  if (dna.textures.materials) {
    parts.push(`Materials/textures: ${dna.textures.materials}.`);
  }

  return parts.join(" ");
}

// ── Subject/identity block ────────────────────────────────────────────────────

function buildIdentityBlock(
  profile: SubjectProfile | null,
  intent: UserIntent,
  hasSubjectImage: boolean
): string {
  const parts: string[] = [];

  if (profile) {
    if (profile.subjectType === "person" && profile.person) {
      const p = profile.person;
      const descParts: string[] = [];
      if (p.gender) descParts.push(p.gender);
      if (p.approximateAge) descParts.push(p.approximateAge);
      if (p.hairColor && p.hairStyle) descParts.push(`${p.hairColor} ${p.hairStyle} hair`);
      else if (p.hairColor) descParts.push(`${p.hairColor} hair`);
      if (p.skinTone) descParts.push(`skin tone: ${p.skinTone}`);
      if (p.distinctiveFeatures) descParts.push(p.distinctiveFeatures);
      if (p.currentClothing) descParts.push(`wearing: ${p.currentClothing}`);
      if (descParts.length > 0) parts.push(`Person: ${descParts.join(", ")}.`);
    } else if (profile.subjectType === "product" && profile.product) {
      const p = profile.product;
      const descParts: string[] = [];
      if (p.category) descParts.push(p.category);
      if (p.primaryColor) descParts.push(`primary color: ${p.primaryColor}`);
      if (p.shape) descParts.push(`shape: ${p.shape}`);
      if (p.distinctiveFeatures) descParts.push(p.distinctiveFeatures);
      if (descParts.length > 0) parts.push(`Product: ${descParts.join(", ")}.`);
    }

    parts.push(profile.preservationInstructions);

    if (hasSubjectImage || profile.identityStrength >= 70) {
      parts.push("Strict identity preservation — exact likeness, do not drift, do not reimagine or replace the subject.");
    }
  } else if (hasSubjectImage) {
    parts.push("Strict identity preservation — exact likeness, do not drift, do not reimagine or replace.");
  }

  if (intent.framing) parts.push(`Framing: ${intent.framing}.`);
  if (intent.cameraAngle) parts.push(`Camera angle: ${intent.cameraAngle}.`);

  parts.push("Sharp focus on subject. No overprocessing. No plastic skin. No dead eyes.");

  return parts.join(" ");
}

// ── Text zone instruction ─────────────────────────────────────────────────────

const TEXT_ZONE_MAP: Record<string, string> = {
  top:    "Keep upper 35% of frame dark and visually atmospheric for text overlay. Subject placed in lower 2/3.",
  bottom: "Keep lower 35% of frame dark and visually atmospheric for text overlay. Subject placed in upper 2/3.",
  left:   "Keep left 45% of frame dark and visually atmospheric for text overlay. Subject right-aligned.",
  right:  "Keep right 45% of frame dark and visually atmospheric for text overlay. Subject left-aligned.",
  over:   "Subject centered. Ensure contrast variation across frame so text can be legible over it.",
};

function resolveTextZone(position: string, aspectRatio: string): string {
  const key = position?.trim().toLowerCase();
  if (key && TEXT_ZONE_MAP[key]) return TEXT_ZONE_MAP[key];
  // Defaults by aspect ratio
  if (aspectRatio === "9:16") return TEXT_ZONE_MAP["bottom"];
  if (aspectRatio === "16:9") return TEXT_ZONE_MAP["right"];
  return TEXT_ZONE_MAP["bottom"];
}

// ── Scene block ───────────────────────────────────────────────────────────────

function buildSceneBlock(
  dna: VisualDNA | null,
  intent: UserIntent,
  config: CompositionConfig,
  tier: MoodTier
): string {
  const parts: string[] = ["SCENE:"];

  if (dna) {
    // Primary: use DNA lighting
    parts.push(buildLightingFromDNA(dna));
    parts.push(buildColorFromDNA(dna, intent.colors));
    parts.push(buildCompositionFromDNA(dna, config));

    const specialElements = buildSpecialElementsFromDNA(dna);
    if (specialElements) parts.push(specialElements);

    // DNA style reference
    if (dna.style.genre) parts.push(`Visual genre: ${dna.style.genre}.`);
    if (dna.style.realism) parts.push(`Realism level: ${dna.style.realism}.`);
    if (dna.style.productionLevel) parts.push(`Production level: ${dna.style.productionLevel}.`);
    if (dna.promptWeight.mostImportant) parts.push(`Most important visual element: ${dna.promptWeight.mostImportant}.`);
    if (dna.promptWeight.doNotChange) parts.push(`Preserve exactly: ${dna.promptWeight.doNotChange}.`);
  } else {
    // Fallback: tier-based recipes
    parts.push(getTierLightingRecipe(tier));
    parts.push(getTierColorPalette(tier));

    const textZone = resolveTextZone(config.textPosition, config.aspectRatio);
    parts.push(textZone);
  }

  if (intent.sceneDescription) {
    parts.push(`CAMPAIGN INTENT: ${intent.sceneDescription}. Adapt mood, atmosphere, props, and scene to reflect this intent.`);
  }
  if (intent.extraElements) {
    parts.push(`VISUAL DIRECTIVES: ${intent.extraElements}. These are specific visual requirements — include them exactly.`);
  }

  return parts.join(" ");
}

// ── Style block ───────────────────────────────────────────────────────────────

function buildStyleBlock(
  dna: VisualDNA | null,
  config: CompositionConfig,
  tier: MoodTier
): string {
  const moduleLabel =
    config.aspectRatio === "16:9"
      ? "e-commerce promotional banner"
      : config.aspectRatio === "1:1"
      ? "social media marketing creative"
      : "professional editorial photoshoot";

  if (dna) {
    return `Photorealistic cinematic ${moduleLabel}. Professional marketing creative, agency quality. Ultra-detailed, 8K resolution equivalent. Style references: ${dna.style.references || "blockbuster cinema, luxury brand advertising"}. Realism: ${dna.style.realism}. Production level: ${dna.style.productionLevel}.`;
  }

  const tierLabel =
    tier === "drama_impact" ? "DRAMA / IMPACT — cinematic bold composition"
    : tier === "clean_premium" ? "CLEAN / PREMIUM — editorial minimal elegance"
    : tier === "dark_cinematic" ? "DARK / CINEMATIC — atmospheric noir"
    : "COMMERCIAL — professional balanced";

  return `Photorealistic cinematic ${moduleLabel}. Professional marketing creative, agency quality. Ultra-detailed, 8K resolution equivalent. Visual style: ${tierLabel}.`;
}

// ── Quality block ─────────────────────────────────────────────────────────────

function buildQualityBlock(): string {
  return [
    "QUALITY REQUIREMENTS: No plastic skin. No dead eyes. No distorted hands or extra fingers. Anatomically correct proportions.",
    "Consistent lighting — the light direction on the subject must match the scene light source. No contradictory dual lighting.",
    "No white halo or edge fringe around the subject. No JPEG artifacts. No pixelation. No over-compression.",
    "No watermarks. No logos from other tools.",
    "No text, no letters, no words, no numbers, no typography anywhere in the image — zero exceptions.",
    "Print-ready quality. Directly usable in a paid advertising campaign without additional editing.",
  ].join(" ");
}

// ── Text composition zone block ───────────────────────────────────────────────

function buildTextCompositionBlock(intent: UserIntent, config: CompositionConfig): string {
  const hasText = Boolean(intent.headline?.trim() || intent.subheadline?.trim() || intent.cta?.trim());
  const textZone = resolveTextZone(config.textPosition, config.aspectRatio);

  if (hasText) {
    return `TEXT COMPOSITION ZONE: ${textZone} This area will receive real typography in post-processing — keep it visually atmospheric and lower-contrast: no busy textures, no competing details, no hard edges in this zone. The background should feel like it was designed to receive text. Do NOT generate any text, letters, words, numbers, or typographic elements anywhere in the image — zero exceptions.`;
  }
  return `TEXT SAFE AREA: No text in the image. ${textZone} Keep this zone clean and minimal.`;
}

// ── Negative prompt ───────────────────────────────────────────────────────────

function buildNegativePrompt(userNegative?: string): string {
  const core = [
    "plastic skin, waxy face, dead eyes, distorted hands, extra fingers, wrong anatomy, disfigured body",
    "stock photo generic background, inconsistent lighting, two suns, dual contradictory light sources",
    "white halo around subject, edge fringe, cutout artifact, JPEG noise, pixelated, over-compressed",
    "watermark, tool logo, brand logo overlay, copyright stamp",
    "text, letters, words, numbers, typography, headline, label, caption, subtitle, watermark text, any written characters, fonts rendered in scene",
  ].join(", ");

  return userNegative?.trim() ? `${core}, ${userNegative.trim()}` : core;
}

// ── Warnings ──────────────────────────────────────────────────────────────────

function buildWarnings(
  dna: VisualDNA | null,
  profile: SubjectProfile | null,
  intent: UserIntent
): string[] {
  const warnings: string[] = [];

  if (!dna) {
    warnings.push("No VisualDNA available — using tier-based preset recipe as fallback.");
  } else {
    // Check for conflicts between DNA and user colors
    if (intent.colors?.primary && dna.colorPalette.dominant) {
      const userPrimary = intent.colors.primary.toLowerCase();
      if (userPrimary !== dna.colorPalette.dominant.toLowerCase()) {
        warnings.push(`User brand color (${intent.colors.primary}) overrides DNA dominant color (${dna.colorPalette.dominant}).`);
      }
    }
  }

  if (!profile) {
    warnings.push("No SubjectProfile available — identity preservation based on subject image only.");
  } else if (profile.identityStrength < 50) {
    warnings.push(`Low identity strength (${profile.identityStrength}/100) — subject may drift. Recommend higher quality subject image.`);
  }

  return warnings;
}

// ── Main compiler function ────────────────────────────────────────────────────

export interface SmartCompilerInput {
  visualDNA: VisualDNA | null;
  subjectProfile: SubjectProfile | null;
  intent: UserIntent;
  config: CompositionConfig;
  hasSubjectImage: boolean;
  userNegativePrompt?: string;
}

export function compileSmartPrompt(input: SmartCompilerInput): SmartCompiledPrompt {
  const { visualDNA, subjectProfile, intent, config, hasSubjectImage, userNegativePrompt } = input;
  const tier = getMoodTier(intent.preset);

  const blocks: PromptBlocks = {
    identity: buildIdentityBlock(subjectProfile, intent, hasSubjectImage),
    subject: `SUBJECT: ${buildIdentityBlock(subjectProfile, intent, hasSubjectImage)}`,
    visualStyle: buildStyleBlock(visualDNA, config, tier),
    scene: buildSceneBlock(visualDNA, intent, config, tier),
    technical: buildTextCompositionBlock(intent, config) + "\n\n" + buildQualityBlock(),
  };

  const positive = [
    blocks.visualStyle,
    blocks.subject,
    blocks.scene,
    buildTextCompositionBlock(intent, config),
    buildQualityBlock(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    positive,
    negative: buildNegativePrompt(userNegativePrompt),
    structuredBlocks: blocks,
    dnaUsed: visualDNA !== null,
    warnings: buildWarnings(visualDNA, subjectProfile, intent),
  };
}
