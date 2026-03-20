/// <reference lib="deno.ns" />

// =============================================================================
// CREATYNG — VISION FIRST STAGE 1: Vision Analysis (DIFF VF.2)
// Gemini Flash extrai VisualDNA e SubjectProfile de imagens de referência.
// Usa cascading model fallback (gemini-2.5-flash → gemini-2.5-pro → gemini-2.0-flash).
// =============================================================================

import type { VisualDNA, SubjectProfile, VisionAnalysisResult } from "./types.ts";

const VISION_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];
const VISION_TIMEOUT_MS = 30_000;

// ── Prompts de extração ───────────────────────────────────────────────────────

const DNA_EXTRACTION_PROMPT = `Analyze this image and extract its visual DNA as a JSON object.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

Required JSON structure:
{
  "lighting": {
    "type": "<3-point|rim|key|ambient|natural|studio|available>",
    "direction": "<front|front-left|front-right|side|top|back|under>",
    "color": "<color description of main light>",
    "rimColor": "<color of rim/backlight, or empty string if absent>",
    "intensity": "<soft|medium|dramatic|extreme>",
    "shadows": "<soft|medium|hard|deep>"
  },
  "colorPalette": {
    "dominant": "<hex>",
    "secondary": "<hex>",
    "accent": "<hex>",
    "background": "<hex>",
    "overall": "<5-word mood description>"
  },
  "atmosphere": {
    "mood": "<cinematic|dramatic|clean|dark|editorial|luxury|energetic|natural>",
    "particles": <true|false>,
    "particleType": "<sparks|dust|embers|bokeh|none>",
    "fog": <true|false>,
    "glowEffects": <true|false>,
    "depthOfField": "<none|subtle|moderate|strong|extreme>"
  },
  "composition": {
    "subjectPosition": "<center|left|right|lower-center|upper-center>",
    "subjectSize": "<close-up|portrait|half-body|full-body|product-shot>",
    "cameraAngle": "<eye-level|low-angle|high-angle|dutch|overhead>",
    "foregroundElements": "<description or empty string>",
    "backgroundElements": "<description>",
    "planes": <1|2|3|4>,
    "negativeSpace": "<top|bottom|left|right|none>"
  },
  "style": {
    "genre": "<superhero|fashion|commercial|dark-fantasy|editorial|lifestyle|product>",
    "realism": "<photorealistic|cinematic|stylized|illustrated>",
    "productionLevel": "<amateur|commercial|blockbuster|luxury>",
    "era": "<modern|futuristic|retro|timeless>",
    "references": "<movies/brands this image reminds of>"
  },
  "textures": {
    "skin": "<natural|dramatic|stylized|not-applicable>",
    "materials": "<texture description>",
    "surfaceQuality": "<matte|glossy|mixed>"
  },
  "specialElements": {
    "effects3D": <true|false>,
    "effects3DDescription": "<crystals, prisms, floating objects or empty string>",
    "energyEffects": <true|false>,
    "energyDescription": "<portals, neon, electricity or empty string>",
    "environmentalElements": "<rocks, water, fire, smoke or empty string>"
  },
  "promptWeight": {
    "mostImportant": "<the ONE element that defines this image most>",
    "doNotChange": "<what MUST be preserved at all costs>",
    "optional": "<what can vary without breaking the style>"
  }
}`;

const SUBJECT_EXTRACTION_PROMPT = `Analyze the main subject in this image and extract identity information as JSON.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

Required JSON structure:
{
  "subjectType": "<person|product|animal|vehicle|food|logo|other>",
  "person": {
    "gender": "<male|female|non-binary|null>",
    "approximateAge": "<child|teen|young adult|adult|middle-aged|senior|null>",
    "hairColor": "<color or null>",
    "hairStyle": "<style description or null>",
    "skinTone": "<fitzpatrick scale 1-6 or description or null>",
    "eyeColor": "<color or null>",
    "facialHair": "<description or null>",
    "distinctiveFeatures": "<glasses, tattoos, scars, piercings or null>",
    "bodyType": "<slim|athletic|average|plus-size|null>",
    "currentClothing": "<clothing description or null>"
  },
  "product": {
    "category": "<electronics|apparel|food|beauty|home|sports|null>",
    "primaryColor": "<color or null>",
    "shape": "<shape description or null>",
    "distinctiveFeatures": "<logos, text, unique design elements or null>"
  },
  "framing": {
    "currentCrop": "<close-up|portrait|half-body|full-body|product-shot>",
    "faceVisible": <true|false>,
    "faceQuality": "<clear|partial|obscured>"
  },
  "identityStrength": <0-100>,
  "preservationInstructions": "<specific instruction for preserving this exact subject>"
}

Set person to null if subjectType is not person.
Set product to null if subjectType is not product.
identityStrength: 90-100 if face/product is clear and detailed; 50-89 if partial; 0-49 if obscured/low quality.`;

// ── Gemini Flash API caller ───────────────────────────────────────────────────

async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  textPrompt: string,
  apiKey: string
): Promise<string> {
  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
          { text: textPrompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  };

  const bodyStr = JSON.stringify(payload);

  for (const model of VISION_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    try {
      console.log(`[VisionAnalysis] Trying model: ${model}`);
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.warn(`[VisionAnalysis] ${model} HTTP ${resp.status}: ${errText.slice(0, 200)}`);
        continue; // try next model
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text.trim()) {
        console.log(`[VisionAnalysis] ${model} returned response`);
        return text.trim();
      }
      console.warn(`[VisionAnalysis] ${model} returned empty text`);
      continue;
    } catch (err) {
      console.warn(`[VisionAnalysis] ${model} error:`, err);
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`Gemini Vision: all models failed (${VISION_MODELS.join(", ")})`);
}

function parseJsonSafe<T>(raw: string): T | null {
  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Extracts VisualDNA from a style reference image using Gemini Flash.
 *  Returns null (with error string) on failure — never throws. */
export async function analyzeReference(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<{ dna: VisualDNA | null; error?: string }> {
  try {
    const raw = await callGeminiVision(imageBase64, mimeType, DNA_EXTRACTION_PROMPT, apiKey);
    const dna = parseJsonSafe<VisualDNA>(raw);
    if (!dna) {
      return { dna: null, error: `Invalid JSON from Gemini Vision DNA: ${raw.slice(0, 200)}` };
    }
    return { dna };
  } catch (err) {
    return { dna: null, error: String(err) };
  }
}

/** Extracts SubjectProfile from a subject image using Gemini Flash.
 *  Returns null (with error string) on failure — never throws. */
export async function analyzeSubject(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<{ profile: SubjectProfile | null; error?: string }> {
  try {
    const raw = await callGeminiVision(imageBase64, mimeType, SUBJECT_EXTRACTION_PROMPT, apiKey);
    const profile = parseJsonSafe<SubjectProfile>(raw);
    if (!profile) {
      return { profile: null, error: `Invalid JSON from Gemini Vision Subject: ${raw.slice(0, 200)}` };
    }
    return { profile };
  } catch (err) {
    return { profile: null, error: String(err) };
  }
}

/** Runs both analyses in parallel. Used by the orchestrator in index.ts.
 *  subjectBase64 is always required. referenceBase64 is optional. */
export async function runVisionAnalysis(opts: {
  subjectBase64: string;
  subjectMime: string;
  referenceBase64?: string;
  referenceMime?: string;
  apiKey: string;
}): Promise<VisionAnalysisResult> {
  const { subjectBase64, subjectMime, referenceBase64, referenceMime, apiKey } = opts;

  const tasks: [Promise<{ dna: VisualDNA | null; error?: string }>, Promise<{ profile: SubjectProfile | null; error?: string }>] = [
    referenceBase64 && referenceMime
      ? analyzeReference(referenceBase64, referenceMime, apiKey)
      : Promise.resolve({ dna: null }),
    analyzeSubject(subjectBase64, subjectMime, apiKey),
  ];

  const [dnaResult, profileResult] = await Promise.all(tasks);

  return {
    visualDNA: dnaResult.dna,
    subjectProfile: profileResult.profile,
    errors: {
      dnaError: dnaResult.error,
      subjectError: profileResult.error,
    },
  };
}
