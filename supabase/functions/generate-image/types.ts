/// <reference lib="deno.ns" />

// =============================================================================
// CREATYNG — VISION FIRST TYPES (DIFF VF.1)
// Base de todos os stages do pipeline Vision First.
// Nenhuma lógica aqui — só interfaces e tipos.
// =============================================================================

// ── STAGE 1: Vision Analysis ─────────────────────────────────────────────────

/** DNA visual extraído de uma imagem de referência por Gemini Flash */
export interface VisualDNA {
  lighting: {
    type: string;           // "3-point" | "rim" | "key" | "ambient" | etc.
    direction: string;      // "front-left" | "top" | "side" | etc.
    color: string;          // cor da luz principal
    rimColor: string;       // cor do rim light (se presente)
    intensity: "soft" | "medium" | "dramatic" | "extreme";
    shadows: "soft" | "medium" | "hard" | "deep";
  };
  colorPalette: {
    dominant: string;       // hex da cor dominante
    secondary: string;      // hex da segunda cor
    accent: string;         // hex da cor de destaque
    background: string;     // hex do tom de fundo
    overall: string;        // descrição do mood de cor em ~5 palavras
  };
  atmosphere: {
    mood: string;           // "cinematic" | "dramatic" | "clean" | "dark" | etc.
    particles: boolean;
    particleType: string;   // "sparks" | "dust" | "embers" | "" etc.
    fog: boolean;
    glowEffects: boolean;
    depthOfField: "none" | "subtle" | "moderate" | "strong" | "extreme";
  };
  composition: {
    subjectPosition: string;  // "center" | "left" | "right" | "lower-center" | etc.
    subjectSize: string;      // "close-up" | "portrait" | "half-body" | "full-body"
    cameraAngle: string;      // "eye-level" | "low-angle" | "high-angle" | "dutch"
    foregroundElements: string;
    backgroundElements: string;
    planes: number;           // 1–4 planos de profundidade visíveis
    negativeSpace: string;    // "top" | "bottom" | "left" | "right" | "none"
  };
  style: {
    genre: string;            // "superhero" | "fashion" | "commercial" | "dark-fantasy" | etc.
    realism: string;          // "photorealistic" | "cinematic" | "stylized" | "illustrated"
    productionLevel: string;  // "amateur" | "commercial" | "blockbuster" | "luxury"
    era: string;              // "modern" | "futuristic" | "retro" | "timeless"
    references: string;       // filmes/marcas que essa imagem lembra
  };
  textures: {
    skin: string;             // "natural" | "dramatic" | "stylized"
    materials: string;        // descrição das texturas presentes
    surfaceQuality: string;   // "matte" | "glossy" | "mixed"
  };
  specialElements: {
    effects3D: boolean;
    effects3DDescription: string;   // cristais, prismas, objetos flutuantes
    energyEffects: boolean;
    energyDescription: string;      // portais, neon, eletricidade
    environmentalElements: string;  // rochas, água, fogo, fumaça
  };
  promptWeight: {
    mostImportant: string;  // O UNO que define mais essa imagem
    doNotChange: string;    // O que deve ser preservado a todo custo
    optional: string;       // O que pode variar sem quebrar o estilo
  };
}

/** Perfil de identidade extraído do subject por Gemini Flash */
export interface SubjectProfile {
  subjectType: "person" | "product" | "animal" | "vehicle" | "food" | "logo" | "other";
  person?: {
    gender: string | null;
    approximateAge: string | null;  // "young adult" | "adult" | "middle-aged" | etc.
    hairColor: string | null;
    hairStyle: string | null;
    skinTone: string | null;        // escala Fitzpatrick
    eyeColor: string | null;
    facialHair: string | null;
    distinctiveFeatures: string | null;  // óculos, tatuagens, cicatrizes, etc.
    bodyType: string | null;
    currentClothing: string | null;
  };
  product?: {
    category: string | null;
    primaryColor: string | null;
    shape: string | null;
    distinctiveFeatures: string | null;
  };
  framing: {
    currentCrop: string;
    faceVisible: boolean;
    faceQuality: "clear" | "partial" | "obscured";
  };
  identityStrength: number;            // 0–100: confiança de preservação de identidade
  preservationInstructions: string;    // instrução específica para preservar este subject
}

// ── STAGE 2: Smart Prompt Compilation ────────────────────────────────────────

/** Intenção do usuário passada para o compilador */
export interface UserIntent {
  headline: string;
  subheadline: string;
  cta: string;
  preset: string;           // "drama" | "clean" | "dark" | "editorial" | "neon"
  framing: string;
  cameraAngle: string;
  textPosition: string;     // "top" | "bottom" | "left" | "right" | "over"
  sceneDescription?: string;
  extraElements?: string;
  colors: {
    primary: string;
    secondary: string;
    neutral: string;
  };
}

/** Configuração de composição para o bloco técnico */
export interface CompositionConfig {
  aspectRatio: string;      // "1:1" | "9:16" | "16:9" | "4:5"
  width: number;
  height: number;
  textPosition: string;
}

/** Blocos estruturados do prompt compilado */
export interface PromptBlocks {
  identity: string;
  subject: string;
  visualStyle: string;
  scene: string;
  technical: string;
}

/** Resultado do Smart Prompt Compiler */
export interface SmartCompiledPrompt {
  positive: string;
  negative: string;
  structuredBlocks: PromptBlocks;
  dnaUsed: boolean;
  warnings: string[];   // ex: "DNA e preset conflitam em iluminação — DNA prevalece"
}

// ── STAGE 3: Preprocessing ───────────────────────────────────────────────────

export type PreprocessFlag =
  | "background_removed"
  | "background_neutralized"
  | "upscaled"
  | "padded"
  | "centered"
  | "orientation_corrected";

export interface PreprocessingResult {
  subject: {
    base64: string;
    width: number;
    height: number;
    flags: PreprocessFlag[];
    sha256: string;
  };
  reference?: {
    base64: string;
    width: number;
    height: number;
    resizedForProvider: "gemini" | "replicate";
  };
}

// ── STAGE 5: Quality Analysis ─────────────────────────────────────────────────

export interface QualityCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail?: string;
}

export interface QualityResult {
  score: number;          // 0–100
  passed: boolean;        // score >= 70
  checks: QualityCheck[];
  recommendation: "approve" | "retry_same" | "retry_other_provider" | "fail";
  retryProvider?: "gemini" | "replicate";
}

// ── STAGE 6: Text Rendering ──────────────────────────────────────────────────

export type TextPosition = "top" | "bottom" | "left" | "right" | "over";
export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light";

export interface TextRenderConfig {
  imageBase64: string;
  texts: {
    headline?: string;
    subheadline?: string;
    cta?: string;
  };
  style: {
    headlineFont: string;
    bodyFont: string;
    headlineColor: string;
    accentColor: string;
    textPosition: TextPosition;
    blendMode?: BlendMode;
  };
  canvas: {
    width: number;
    height: number;
  };
}

// ── Vision Analysis Request/Response ─────────────────────────────────────────

export interface VisionAnalysisResult {
  visualDNA: VisualDNA | null;
  subjectProfile: SubjectProfile | null;
  errors: {
    dnaError?: string;
    subjectError?: string;
  };
}
