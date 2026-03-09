// src/features/editor/engine/popDesign.ts
// CREATYNG — Paradigma B: Pop Design (reestruturado)
// Pipeline: vibrant bg → decorative text → isolated subject →
//           centered headline → subheadline → centered badge → centered contact bar
//
// NÃO usa renderPriceBadge/renderContactBar do textRenderer —
// usa versões próprias centralizadas.

import type { TextPresetConfig } from "@/types/preset";
import type { FoodPalette } from "./exportComposed";

// ─── TIPOS PÚBLICOS ───────────────────────────────────────────────────────────

export interface PopTexts {
  headline: string;
  subheadline?: string;
  cta?: string;
  price?: { value: string; prefix: string; suffix: string } | null;
  whatsapp?: string;
  instagram?: string;
}

// ─── HELPERS DE COR ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");
}

/** Blend hex color toward white. factor 0 = original, 1 = white. */
function lighten(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

/** Blend hex color toward black. factor 0 = original, 1 = black. */
function darken(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

// ─── DIFF 1 — FUNDO COM COR REAL ─────────────────────────────────────────────

interface PopBackground {
  colors: [string, string];
  angle: number;
  textColor: string; // '#FFFFFF' se fundo escuro, accent se fundo claro
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getPopBackground(palette: FoodPalette, headline: string): PopBackground {
  const hash = simpleHash(headline || "pop");
  const useDark = hash % 3 === 0; // ~33% chance de fundo escuro

  if (useDark) {
    return {
      colors: [darken(palette.accent, 0.50), darken(palette.accent, 0.65)],
      angle: 160,
      textColor: "#FFFFFF",
    };
  }

  // Fundo claro com COR PRESENTE — lighten 65-75%, não 85-90%
  return {
    colors: [lighten(palette.accent, 0.65), lighten(palette.accent, 0.75)],
    angle: 160,
    textColor: palette.accent,
  };
}

function renderPopBackground(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  bg: PopBackground
): void {
  const rad = (bg.angle * Math.PI) / 180;
  const diagLen = Math.sqrt(cw * cw + ch * ch) / 2;
  const cx = cw / 2;
  const cy = ch / 2;

  const grad = ctx.createLinearGradient(
    cx - Math.cos(rad) * diagLen,
    cy - Math.sin(rad) * diagLen,
    cx + Math.cos(rad) * diagLen,
    cy + Math.sin(rad) * diagLen,
  );
  grad.addColorStop(0, bg.colors[0]);
  grad.addColorStop(1, bg.colors[1]);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // Sutil highlight radial no centro
  const radial = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy * 0.85, cw * 0.6);
  radial.addColorStop(0, "rgba(255,255,255,0.14)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, cw, ch);
}

// ─── DIFF 2 — TEXTO DECORATIVO VIBRANTE (substitui blobs) ────────────────────

const DECO_SKIP = new Set([
  "DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "AS", "OS",
  "EM", "NO", "NA", "NOS", "NAS", "COM", "POR", "PARA", "ATÉ",
  "THE", "AN", "OF", "IN", "ON", "AT", "BY", "FOR", "WITH", "AND",
]);

function extractDecorativeWord(headline: string): string {
  const words = headline.toUpperCase().trim().split(/\s+/);
  for (const word of words) {
    if (!DECO_SKIP.has(word) && word.length >= 3) return word;
  }
  return words[0] || "";
}

function renderPopDecorativeText(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  headline: string,
  accentColor: string,
  bgIsDark: boolean
): void {
  const word = extractDecorativeWord(headline);
  if (!word) return;

  ctx.save();

  // Tamanho ENORME: calibrar para 130% da largura
  ctx.font = `900 ${cw * 0.5}px Montserrat, sans-serif`;
  const measured = ctx.measureText(word).width;
  const targetWidth = cw * 1.3;
  const ratio = targetWidth / measured;
  const fontSize = Math.min(cw * 0.5 * ratio, cw * 0.7);

  ctx.font = `900 ${fontSize}px Montserrat, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = cw / 2;
  const centerY = ch * 0.50;

  if (bgIsDark) {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#FFFFFF";
  } else {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = accentColor;
  }
  ctx.fillText(word, centerX, centerY);

  // Segunda linha deslocada — efeito de profundidade volumétrica
  ctx.globalAlpha = bgIsDark ? 0.03 : 0.10;
  ctx.fillText(word, centerX, centerY + fontSize * 0.80);

  ctx.restore();
}

// ─── SUBJECT ──────────────────────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Convert near-white pixels to transparent on an offscreen canvas.
 * threshold: pixels with min(R,G,B) above this value fade to transparent.
 * Pixels at 255 → alpha 0; at threshold → alpha 255. Smooth linear ramp.
 */
function makeWhiteTransparent(img: HTMLImageElement, threshold = 232): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width  = img.naturalWidth;
  off.height = img.naturalHeight;
  const offCtx = off.getContext("2d")!;
  offCtx.drawImage(img, 0, 0);

  const imageData = offCtx.getImageData(0, 0, off.width, off.height);
  const d = imageData.data;
  const range = 255 - threshold;

  for (let i = 0; i < d.length; i += 4) {
    const whiteness = Math.min(d[i], d[i + 1], d[i + 2]);
    if (whiteness > threshold) {
      const alpha = Math.round((255 - whiteness) / range * 255);
      d[i + 3] = Math.min(d[i + 3], alpha);
    }
  }

  offCtx.putImageData(imageData, 0, 0);
  return off;
}

interface SubjectOpts {
  scale?: number;       // fração de ch como altura (padrão 0.82)
  offsetY?: number;     // offset adicional, fração de ch (padrão 0.05 → levemente abaixo do centro)
  shadowBlur?: number;
  shadowColor?: string;
}

function renderIsolatedSubject(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  img: HTMLImageElement,
  opts: SubjectOpts = {}
): void {
  const {
    scale       = 0.82,
    offsetY     = 0.05,
    shadowBlur  = 35,
    shadowColor = "rgba(0,0,0,0.20)",
  } = opts;

  const targetH = ch * scale;
  const imgScale = targetH / img.naturalHeight;
  const drawW = img.naturalWidth * imgScale;
  const drawH = img.naturalHeight * imgScale;

  // Centralizado horizontalmente; verticalmente centrado com offset sutil
  const drawX = (cw - drawW) / 2;
  const drawY = (ch - drawH) / 2 + ch * offsetY;

  // Apply white-to-transparent conversion (preserves flying elements, removes white BG)
  const masked = makeWhiteTransparent(img);

  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = ch * 0.020;
  ctx.drawImage(masked, drawX, drawY, drawW, drawH);
  ctx.restore();
}

// ─── DIFF 3 + 4 — HEADLINE CENTRALIZADA, SEM SOMBRA PESADA ──────────────────

const CONNECTOR_WORDS = new Set([
  "DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "AS", "OS",
  "EM", "NO", "NA", "NOS", "NAS", "COM", "POR", "PARA", "ATÉ",
  "THE", "AN", "OF", "IN", "ON", "AT", "BY", "FOR", "WITH", "AND",
]);

interface PopSegment {
  text: string;
  weight: number;
  sizeFactor: number;
  isAccent: boolean;
}

function segmentPopHeadline(headline: string): PopSegment[] {
  const words = headline.toUpperCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (words.length === 1) {
    return [{ text: words[0], weight: 900, sizeFactor: 1.0, isAccent: true }];
  }
  if (words.length === 2) {
    return [
      { text: words[0], weight: 900, sizeFactor: 1.0,  isAccent: true  },
      { text: words[1], weight: 500, sizeFactor: 0.45, isAccent: false },
    ];
  }
  // 3+ palavras: produto antes do primeiro connector
  let splitIndex = words.length - 1;
  for (let i = 1; i < words.length; i++) {
    if (CONNECTOR_WORDS.has(words[i])) { splitIndex = i; break; }
  }
  splitIndex = Math.max(1, Math.min(splitIndex, words.length - 1));
  return [
    { text: words.slice(0, splitIndex).join(" "), weight: 900, sizeFactor: 1.0,  isAccent: true  },
    { text: words.slice(splitIndex).join(" "),    weight: 500, sizeFactor: 0.45, isAccent: false },
  ];
}

/**
 * Renderiza headline centralizada no topo.
 * Retorna Y final após o último segmento.
 */
function renderPopHeadline(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  headline: string,
  accentColor: string,
  bgIsDark: boolean
): number {
  if (!headline.trim()) return ch * 0.06;

  const segments = segmentPopHeadline(headline);
  const baseSize = Math.round(cw * 0.14); // larger base for presence
  const centerX = cw / 2;
  let currentY = ch * 0.04; // tight to the top

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic"; // use baseline so +0.8 offset works naturally

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const fontSize = Math.round(baseSize * seg.sizeFactor);

    ctx.font = `${seg.weight} ${fontSize}px Montserrat, sans-serif`;

    if (bgIsDark) {
      ctx.fillStyle = seg.isAccent ? "#FFFFFF" : "rgba(255,255,255,0.75)";
    } else {
      ctx.fillStyle = seg.isAccent ? accentColor : "#2D2D2D";
    }

    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // draw at currentY + fontSize*0.8 (baseline offset from currentY slot)
    ctx.fillText(seg.text, centerX, currentY + fontSize * 0.8);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Tight gap: non-last segments 0.45, last 0.6
    currentY += fontSize * (i < segments.length - 1 ? 0.45 : 0.60);
  }

  ctx.restore();
  return currentY;
}

// ─── DIFF 5 — BADGE CENTRALIZADO ─────────────────────────────────────────────

function roundRectPop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function renderPopBadge(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  price: { value: string; prefix: string; suffix: string },
  cta: string,
  accentColor: string,
  bgIsDark: boolean
): void {
  if (!price?.value) return;

  const badgeW = cw * 0.54;
  const badgeH = ch * 0.082;
  const badgeX = (cw - badgeW) / 2; // CENTRALIZADO
  const badgeY = ch * 0.775;

  ctx.save();

  // Fundo: sempre branco com alta opacidade para leitura
  ctx.fillStyle = bgIsDark ? "rgba(255,255,255,0.93)" : "rgba(255,255,255,0.96)";
  roundRectPop(ctx, badgeX, badgeY, badgeW, badgeH, 14);
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Borda accent sutil
  ctx.strokeStyle = accentColor + "30";
  ctx.lineWidth = 2;
  roundRectPop(ctx, badgeX, badgeY, badgeW, badgeH, 14);
  ctx.stroke();

  ctx.textBaseline = "middle";
  const centerBadgeX = badgeX + badgeW / 2;
  const midY = badgeY + badgeH / 2;
  const priceFontSize = badgeH * 0.44;

  const priceText = `${price.prefix ? price.prefix + " " : ""}${price.value}`;

  if (cta) {
    // Preço à esquerda, CTA botão à direita
    ctx.textAlign = "center";
    const leftCx = badgeX + badgeW * 0.30;

    // Divisor
    ctx.beginPath();
    ctx.moveTo(centerBadgeX, badgeY + badgeH * 0.15);
    ctx.lineTo(centerBadgeX, badgeY + badgeH * 0.85);
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Preço
    if (price.suffix) {
      ctx.font = `500 ${priceFontSize * 0.38}px Montserrat, sans-serif`;
      ctx.fillStyle = "rgba(100,100,100,0.9)";
      ctx.fillText(price.suffix.toUpperCase(), leftCx, badgeY + badgeH * 0.27);
      ctx.font = `800 ${priceFontSize}px Montserrat, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(priceText, leftCx, badgeY + badgeH * 0.68);
    } else {
      ctx.font = `800 ${priceFontSize}px Montserrat, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(priceText, leftCx, midY);
    }

    // CTA — botão com fundo accent
    const ctaW = badgeW * 0.38;
    const ctaH = badgeH * 0.55;
    const ctaX = badgeX + badgeW - ctaW - 12;
    const ctaYPos = badgeY + (badgeH - ctaH) / 2;
    ctx.fillStyle = accentColor;
    roundRectPop(ctx, ctaX, ctaYPos, ctaW, ctaH, 8);
    ctx.fill();
    ctx.font = `700 ${priceFontSize * 0.44}px Montserrat, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(cta.toUpperCase(), ctaX + ctaW / 2, midY);
  } else {
    // Só preço centralizado
    ctx.textAlign = "center";
    if (price.suffix) {
      ctx.font = `500 ${priceFontSize * 0.38}px Montserrat, sans-serif`;
      ctx.fillStyle = "rgba(100,100,100,0.9)";
      ctx.fillText(price.suffix.toUpperCase(), centerBadgeX, badgeY + badgeH * 0.28);
      ctx.font = `800 ${priceFontSize}px Montserrat, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(priceText, centerBadgeX, badgeY + badgeH * 0.70);
    } else {
      ctx.font = `800 ${priceFontSize}px Montserrat, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(priceText, centerBadgeX, midY);
    }
  }

  ctx.restore();
}

// ─── CONTACT BAR CENTRALIZADA ─────────────────────────────────────────────────

function renderPopContactBar(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  whatsapp: string | undefined,
  instagram: string | undefined,
  accentColor: string,
  bgIsDark: boolean
): void {
  if (!whatsapp && !instagram) return;

  const barY = ch * 0.930;
  const fontSize = Math.round(cw * 0.022);

  const items: string[] = [];
  if (whatsapp) items.push(whatsapp);
  if (instagram) items.push(instagram.startsWith("@") ? instagram : `@${instagram}`);
  const text = items.join("   •   ");

  ctx.save();
  ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
  ctx.fillStyle = bgIsDark ? "rgba(255,255,255,0.72)" : "rgba(30,30,30,0.52)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = bgIsDark ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.04)";
  ctx.shadowBlur = 2;
  ctx.fillText(text, cw / 2, barY);
  ctx.restore();
}

// ─── WATERMARK ────────────────────────────────────────────────────────────────

function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `bold ${Math.round(w * 0.018)}px Inter, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("✦ CREATYNG.COM", w - w * 0.02, h - h * 0.012);
  ctx.restore();
}

// ─── PIPELINE V2 — DUPLO GEMINI (FUNDO SEPARADO + SUBJECT SEPARADO) ──────────

/**
 * Compõe Pop Design com profundidade real usando duas imagens Gemini:
 * - bgBase64: fundo colorido com elementos (Chamada 1 — texto-para-imagem)
 * - subjectBase64: subject isolado em fundo branco (Chamada 2 — img2img)
 *
 * Camadas (de baixo para cima):
 * 1. Fundo Gemini (bgBase64) — preenche o canvas inteiro via smart crop
 * 2. Texto decorativo gigante — atrás do subject, cria profundidade
 * 3. Subject isolado (white-threshold) — na frente de tudo
 * 4. Headline centralizada no topo
 * 5. Subheadline
 * 6. Badge de preço
 * 7. Contact bar
 * 8. Watermark (opcional)
 */
export async function composePopDesignV2(
  bgBase64: string,
  subjectBase64: string,
  texts: PopTexts,
  palette: FoodPalette,
  _presetConfig: TextPresetConfig,
  canvasWidth  = 1080,
  canvasHeight = 1080,
  watermark    = false,
): Promise<string> {
  const cw = canvasWidth;
  const ch = canvasHeight;

  const canvas = document.createElement("canvas");
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;

  const accentColor = palette.accent || "#7B2D8E";
  const headline    = texts.headline || "";

  const hasBgFromGemini = Boolean(bgBase64 && bgBase64.length > 100);

  // ── 1. Fundo ──
  let bgIsDark: boolean;
  if (hasBgFromGemini) {
    const bgImg = await loadImage(bgBase64);
    // Smart crop: fill canvas without distortion (center crop)
    const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
    const canvasAspect = cw / ch;
    let sx = 0, sy = 0, sw = bgImg.naturalWidth, sh = bgImg.naturalHeight;
    if (bgAspect > canvasAspect) {
      sw = Math.round(bgImg.naturalHeight * canvasAspect);
      sx = Math.round((bgImg.naturalWidth - sw) / 2);
    } else {
      sh = Math.round(bgImg.naturalWidth / canvasAspect);
      sy = Math.round((bgImg.naturalHeight - sh) / 2);
    }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, cw, ch);
    bgIsDark = true; // Gemini background is always colorful/saturated — use white text
  } else {
    // Fallback: renderer gradient
    const bg = getPopBackground(palette, headline);
    renderPopBackground(ctx, cw, ch, bg);
    bgIsDark = bg.textColor === "#FFFFFF";
  }

  // ── 2. Texto decorativo gigante (ATRÁS do subject) ──
  if (headline) {
    renderPopDecorativeText(ctx, cw, ch, headline, accentColor, bgIsDark);
  }

  // ── 3. Subject isolado com white-threshold ──
  try {
    const subjectImg = await loadImage(subjectBase64);
    renderIsolatedSubject(ctx, cw, ch, subjectImg, {
      scale:       0.82,
      offsetY:     0.05,
      shadowBlur:  40,
      shadowColor: "rgba(0,0,0,0.30)",
    });
  } catch {
    console.warn("[Creatyng PopDesignV2] Failed to render subject image.");
  }

  // ── 4. Headline ──
  const headlineEndY = renderPopHeadline(ctx, cw, ch, headline, accentColor, bgIsDark);

  // ── 5. Subheadline ──
  if (texts.subheadline?.trim()) {
    const subSize = Math.round(cw * 0.028);
    ctx.save();
    ctx.font = `400 ${subSize}px Montserrat, sans-serif`;
    ctx.fillStyle = bgIsDark ? "rgba(255,255,255,0.70)" : "rgba(30,30,30,0.55)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(texts.subheadline, cw / 2, headlineEndY + ch * 0.018);
    ctx.restore();
  }

  // ── 6. Badge ──
  if (texts.price?.value) {
    renderPopBadge(ctx, cw, ch, texts.price, texts.cta || "", accentColor, bgIsDark);
  }

  // ── 7. Contact bar ──
  renderPopContactBar(ctx, cw, ch, texts.whatsapp, texts.instagram, accentColor, bgIsDark);

  // ── 8. Watermark ──
  if (watermark) applyWatermark(ctx, cw, ch);

  return canvas.toDataURL("image/png", 0.95);
}

// ─── PIPELINE V1 — SINGLE GEMINI (original, mantido como fallback) ────────────

/**
 * Compõe o criativo Pop Design completo e retorna base64 PNG.
 *
 * Etapas:
 * 1. Fundo vibrante (claro ou escuro, ~33% escuro, ~67% claro)
 * 2. Texto decorativo gigante vibrante (atrás de tudo)
 * 3. Subject isolado centralizado
 * 4. Headline centralizada no topo
 * 5. Subheadline
 * 6. Badge centralizado
 * 7. Contact bar centralizada
 * 8. Watermark (opcional)
 */
export async function composePopDesign(
  subjectBase64: string,
  texts: PopTexts,
  palette: FoodPalette,
  _presetConfig: TextPresetConfig,
  canvasWidth  = 1080,
  canvasHeight = 1080,
  watermark    = false,
): Promise<string> {
  const cw = canvasWidth;
  const ch = canvasHeight;

  const canvas = document.createElement("canvas");
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;

  const accentColor = palette.accent || "#7B2D8E";
  const headline    = texts.headline || "";

  // ── 1. Fundo vibrante com cor real ──
  const bg = getPopBackground(palette, headline);
  renderPopBackground(ctx, cw, ch, bg);
  const bgIsDark = bg.textColor === "#FFFFFF";

  // ── 2. Texto decorativo gigante (atrás do subject) ──
  if (headline) {
    renderPopDecorativeText(ctx, cw, ch, headline, accentColor, bgIsDark);
  }

  // ── 3. Subject isolado centralizado ──
  try {
    const subjectImg = await loadImage(subjectBase64);
    renderIsolatedSubject(ctx, cw, ch, subjectImg, {
      scale:       0.82,
      offsetY:     0.05,
      shadowBlur:  35,
      shadowColor: bgIsDark ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.18)",
    });
  } catch {
    console.warn("[Creatyng PopDesign] Failed to render subject image.");
  }

  // ── 4. Headline centralizada no topo ──
  const headlineEndY = renderPopHeadline(ctx, cw, ch, headline, accentColor, bgIsDark);

  // ── 5. Subheadline ──
  if (texts.subheadline?.trim()) {
    const subSize = Math.round(cw * 0.028);
    ctx.save();
    ctx.font = `400 ${subSize}px Montserrat, sans-serif`;
    ctx.fillStyle = bgIsDark ? "rgba(255,255,255,0.70)" : "rgba(30,30,30,0.55)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(texts.subheadline, cw / 2, headlineEndY + ch * 0.018);
    ctx.restore();
  }

  // ── 6. Badge centralizado ──
  if (texts.price?.value) {
    renderPopBadge(ctx, cw, ch, texts.price, texts.cta || "", accentColor, bgIsDark);
  }

  // ── 7. Contact bar centralizada ──
  renderPopContactBar(ctx, cw, ch, texts.whatsapp, texts.instagram, accentColor, bgIsDark);

  // ── 8. Watermark ──
  if (watermark) applyWatermark(ctx, cw, ch);

  return canvas.toDataURL("image/png", 0.95);
}
