// src/features/editor/engine/popDesign.ts
// CREATYNG — Paradigma B: Pop Design
// Pipeline completo: bg removal → gradient bg → organic blobs → isolated subject
// → composed dark/accent headline → price badge → contact bar
// Não usa Gemini — composição 100% client-side.

import type { TextPresetConfig, ColorConfig } from "@/types/preset";
import { renderPriceBadge, renderContactBar, chooseBadgeVariant, type ContactVariant } from "./textRenderer";
import type { FoodPalette } from "./exportComposed";

// ─── TIPOS LOCAIS ──────────────────────────────────────────────────────────────

export interface PopDesignData {
  price?: { value: string; prefix: string; suffix: string } | null;
  whatsapp?: string;
  instagram?: string;
  palette: FoodPalette;
}

export interface ComposePopDesignOptions {
  /** Subject ORIGINAL base64 (com fundo). */
  subjectBase64: string;
  /** Subject já isolado (PNG transparente). Passe para evitar re-processar. */
  subjectIsolatedBase64?: string | null;
  texts: {
    headline: string;
    subheadline?: string;
    cta?: string;
  };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  /** Output size */
  width: number;
  height: number;
  popData: PopDesignData;
  watermark?: boolean;
}

// ─── HELPERS DE COR ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

/** Clamp-lighten a hex color by a 0-255 amount. */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

// ─── PALETA DE FUNDO ──────────────────────────────────────────────────────────

interface PopBackground {
  bg1: string;  // gradient stop 1
  bg2: string;  // gradient stop 2
  bg3: string;  // gradient stop 3 (corner)
  blob1: string;
  blob2: string;
}

function getPopBackground(accent: string): PopBackground {
  const [r, g, b] = hexToRgb(accent);
  // Very light tints of the accent for a "editorial illustration" feel
  const bg1 = rgbToHex(Math.min(255, r + 190), Math.min(255, g + 190), Math.min(255, b + 170));
  const bg2 = rgbToHex(Math.min(255, r + 210), Math.min(255, g + 210), Math.min(255, b + 200));
  const bg3 = rgbToHex(Math.min(255, r + 160), Math.min(255, g + 165), Math.min(255, b + 145));
  const blob1 = lighten(accent, 140);
  const blob2 = lighten(accent, 160);
  return { bg1, bg2, bg3, blob1, blob2 };
}

// ─── BACKGROUND GRADIENT ──────────────────────────────────────────────────────

function renderPopBackground(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  bg: PopBackground
): void {
  // Main gradient: top-left (bg1) → bottom-right (bg3)
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, bg.bg1);
  grad.addColorStop(0.55, bg.bg2);
  grad.addColorStop(1, bg.bg3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // Subtle radial highlight center
  const radial = ctx.createRadialGradient(
    cw * 0.5, ch * 0.42, 0,
    cw * 0.5, ch * 0.42, cw * 0.65
  );
  radial.addColorStop(0, "rgba(255,255,255,0.18)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, cw, ch);
}

// ─── LCG SEED (deterministic randomness) ──────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function makeLCG(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── ORGANIC BLOBS ────────────────────────────────────────────────────────────

interface BlobSpec {
  cx: number;       // 0-1 relative to cw
  cy: number;       // 0-1 relative to ch
  rx: number;       // 0-1 relative to cw
  ry: number;       // 0-1 relative to ch
  rotation: number; // radians
  color: string;
  opacity: number;
  points: number;   // number of control points
  distortion: number; // 0-0.4
}

function generateBlobPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  rotation: number,
  points: number,
  distortion: number,
  rng: () => number
): void {
  const angleStep = (Math.PI * 2) / points;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = i * angleStep + rotation;
    const d = 1 + (rng() - 0.5) * distortion * 2;
    const x = cx + Math.cos(angle) * rx * d;
    const y = cy + Math.sin(angle) * ry * d;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      // Smooth bezier tangent
      const prevAngle = (i - 1) * angleStep + rotation;
      const pd = 1 + (rng() - 0.5) * distortion * 2;
      const px = cx + Math.cos(prevAngle) * rx * pd;
      const py = cy + Math.sin(prevAngle) * ry * pd;
      const cpx1 = px + (x - cx) * 0.25;
      const cpy1 = py + (y - cy) * 0.25;
      const cpx2 = x - (x - cx) * 0.25;
      const cpy2 = y - (y - cy) * 0.25;
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
    }
  }
  ctx.closePath();
}

function getPopBlobs(headline: string, bg: PopBackground): BlobSpec[] {
  const hash = simpleHash(headline || "pop");
  const rng = makeLCG(hash);

  return [
    // Large bottom-right blob
    {
      cx: 0.78 + rng() * 0.12,
      cy: 0.72 + rng() * 0.10,
      rx: 0.30 + rng() * 0.08,
      ry: 0.26 + rng() * 0.06,
      rotation: rng() * Math.PI,
      color: bg.blob1,
      opacity: 0.55,
      points: 7,
      distortion: 0.28,
    },
    // Medium top-left blob
    {
      cx: 0.12 + rng() * 0.10,
      cy: 0.18 + rng() * 0.10,
      rx: 0.20 + rng() * 0.06,
      ry: 0.16 + rng() * 0.05,
      rotation: rng() * Math.PI,
      color: bg.blob2,
      opacity: 0.45,
      points: 6,
      distortion: 0.32,
    },
    // Small accent blob top-right
    {
      cx: 0.82 + rng() * 0.08,
      cy: 0.14 + rng() * 0.08,
      rx: 0.12 + rng() * 0.04,
      ry: 0.10 + rng() * 0.04,
      rotation: rng() * Math.PI,
      color: bg.blob1,
      opacity: 0.35,
      points: 5,
      distortion: 0.22,
    },
    // Tiny bottom-left blob
    {
      cx: 0.08 + rng() * 0.08,
      cy: 0.82 + rng() * 0.08,
      rx: 0.10 + rng() * 0.04,
      ry: 0.08 + rng() * 0.03,
      rotation: rng() * Math.PI,
      color: bg.blob2,
      opacity: 0.30,
      points: 5,
      distortion: 0.25,
    },
  ];
}

function renderBlobs(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  blobs: BlobSpec[],
  headline: string
): void {
  const hash = simpleHash(headline || "pop");
  const rng = makeLCG(hash + 1);

  for (const blob of blobs) {
    ctx.save();
    ctx.globalAlpha = blob.opacity;
    ctx.fillStyle = blob.color;
    generateBlobPath(
      ctx,
      blob.cx * cw, blob.cy * ch,
      blob.rx * cw, blob.ry * ch,
      blob.rotation,
      blob.points,
      blob.distortion,
      rng
    );
    ctx.fill();
    ctx.restore();
  }
}

// ─── ISOLATED SUBJECT ─────────────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function renderIsolatedSubject(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
): void {
  // Subject occupies center, lower-center. Height = 68-72% of canvas.
  const targetH = ch * 0.72;
  const scale = targetH / img.naturalHeight;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;

  // Center horizontally, aligned slightly below center
  const drawX = (cw - drawW) / 2;
  const drawY = ch * 0.14; // starts at 14% from top → bottom at ~86%

  // Drop shadow for depth
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = cw * 0.06;
  ctx.shadowOffsetX = cw * 0.01;
  ctx.shadowOffsetY = ch * 0.025;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

// ─── POP DESIGN HEADLINE ──────────────────────────────────────────────────────

/**
 * Renders the dark/accent composed headline for Pop Design.
 * Impact segment: accent color, 900 weight, italic.
 * Context segment: near-black, 400 weight, normal.
 */
function renderPopHeadline(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  headline: string,
  font: string,
  accent: string,
  darkColor = "#1A1A1A"
): number {
  if (!headline.trim()) return ch * 0.06;

  const words = headline.trim().split(/\s+/);
  const CONNECTORS = new Set([
    "DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "AS", "OS",
    "EM", "NO", "NA", "NOS", "NAS", "COM", "POR", "PARA", "ATÉ",
    "THE", "A", "AN", "OF", "IN", "ON", "AT", "BY", "FOR", "WITH",
  ]);

  // Split: words 0..N-2 are impact (accent), last connector group is context
  // Simple rule: headline last word if short (<= 3 chars) is context; else all impact
  let impactWords = words;
  let contextWords: string[] = [];
  const lastWord = words[words.length - 1].toUpperCase();
  if (words.length > 1 && (CONNECTORS.has(lastWord) || lastWord.length <= 3)) {
    contextWords = [words[words.length - 1]];
    impactWords = words.slice(0, words.length - 1);
  }

  const baseSize = Math.round(Math.max(cw * 0.11, 80));
  const contextSize = Math.round(baseSize * 0.48);
  const padding = cw * 0.06;
  const maxWidth = cw - padding * 2;

  let y = ch * 0.06;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ── Impact segment (accent, italic, bold) ──
  const impactText = impactWords.join(" ").toUpperCase();
  ctx.font = `italic 900 ${baseSize}px "${font}", Montserrat, sans-serif`;
  ctx.fillStyle = accent;

  // Drop shadow for legibility
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  // Word-wrap the impact text
  const impactLines = wrapText(ctx, impactText, maxWidth, baseSize);
  for (const line of impactLines) {
    ctx.fillText(line, padding, y);
    y += baseSize * 0.92;
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // ── Context segment (dark, normal) ──
  if (contextWords.length) {
    const contextText = contextWords.join(" ").toUpperCase();
    ctx.font = `400 ${contextSize}px "${font}", Montserrat, sans-serif`;
    ctx.fillStyle = darkColor;
    ctx.fillText(contextText, padding, y - contextSize * 0.1);
    y += contextSize * 0.85;
  }

  ctx.restore();
  return y;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── SUBHEADLINE ──────────────────────────────────────────────────────────────

function renderPopSubheadline(
  ctx: CanvasRenderingContext2D,
  cw: number,
  text: string,
  y: number,
  font: string,
  darkColor = "#1A1A1A"
): number {
  if (!text.trim()) return y;

  const size = Math.round(cw * 0.038);
  const padding = cw * 0.06;
  ctx.save();
  ctx.font = `500 ${size}px "${font}", Montserrat, sans-serif`;
  ctx.fillStyle = darkColor;
  ctx.globalAlpha = 0.65;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, padding, y);
  ctx.restore();
  return y + size * 1.4;
}

// ─── WATERMARK ────────────────────────────────────────────────────────────────

function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `bold ${Math.round(w * 0.018)}px Inter, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("✦ CREATYNG.COM", w - w * 0.02, h - h * 0.015);
  ctx.restore();
}

// ─── PIPELINE PRINCIPAL ───────────────────────────────────────────────────────

/**
 * Compõe o criativo Pop Design completo e retorna base64 PNG.
 *
 * Etapas:
 * 1. Gradient background
 * 2. Organic blobs
 * 3. Isolated subject (PNG transparent)
 * 4. Composed headline (accent + dark)
 * 5. Subheadline
 * 6. Price badge
 * 7. Contact bar
 * 8. Watermark (opcional)
 */
export async function composePopDesign(
  opts: ComposePopDesignOptions
): Promise<string> {
  const { width: cw, height: ch, texts, presetConfig, colors, popData, watermark = false } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;

  const accent = popData.palette.accent ?? colors.primary ?? "#D4A853";
  const bg = getPopBackground(accent);

  // ── 1. Background gradient ──
  renderPopBackground(ctx, cw, ch, bg);

  // ── 2. Organic blobs ──
  const blobs = getPopBlobs(texts.headline, bg);
  renderBlobs(ctx, cw, ch, blobs, texts.headline);

  // ── 3. Isolated subject ──
  const isolatedSrc = opts.subjectIsolatedBase64 || opts.subjectBase64;
  try {
    const subjectImg = await loadImage(isolatedSrc);
    renderIsolatedSubject(ctx, subjectImg, cw, ch);
  } catch {
    console.warn("[Creatyng PopDesign] Failed to render subject image.");
  }

  // ── 4. Composed headline ──
  const headlineBottomY = renderPopHeadline(
    ctx, cw, ch,
    texts.headline,
    presetConfig.headlineFont,
    accent,
    "#1A1A1A"
  );

  // ── 5. Subheadline ──
  if (texts.subheadline) {
    renderPopSubheadline(ctx, cw, texts.subheadline, headlineBottomY + ch * 0.008, presetConfig.bodyFont, "#1A1A1A");
  }

  // ── 6. Price badge ──
  const canvasSize = { width: cw, height: ch };
  if (popData.price?.value) {
    renderPriceBadge(
      ctx, canvasSize,
      popData.price,
      texts.cta,
      accent,
      popData.palette,
      texts.headline,
    );
  }

  // ── 7. Contact bar ──
  const hasContact = Boolean(popData.whatsapp || popData.instagram);
  if (hasContact) {
    const badgeVariant = popData.price?.value
      ? chooseBadgeVariant(texts.headline ?? "", popData.price.value)
      : null;
    const forceContact: ContactVariant | undefined =
      badgeVariant === "pill-bottom" ? "bar-left" : undefined;

    renderContactBar(
      ctx, canvasSize,
      popData.whatsapp, popData.instagram,
      accent,
      popData.palette,
      forceContact
    );
  }

  // ── 8. Watermark ──
  if (watermark) applyWatermark(ctx, cw, ch);

  return canvas.toDataURL("image/png");
}
