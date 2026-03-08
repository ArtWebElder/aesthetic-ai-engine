// src/features/editor/engine/textRenderer.ts
// CREATYNG — MASTER SPEC DIFF TR.5
// Renderer principal: aplica os 8 presets de texto sobre uma imagem base.

import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";
import { getAccentParts } from "./accentWord";

export interface TextRenderConfig {
  texts: { headline: string; subheadline?: string; cta?: string };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  composition: CompositionConfig;
  canvasWidth: number;
  canvasHeight: number;
}

// ── Zonas de texto ────────────────────────────────────────────────────────────

interface TextZone {
  x: number;
  y: number;
  w: number;
  h: number;
  align: CanvasTextAlign;
  verticalAnchor: "top" | "center" | "bottom";
}

function resolveTextZone(
  comp: CompositionConfig,
  cw: number,
  ch: number
): TextZone {
  const pos = comp.textPosition ?? "bottom";
  const align = (comp.textAlignment ?? "left") as CanvasTextAlign;
  const pad = cw * 0.08; // 8% lateral margin

  switch (pos) {
    case "top":
      return { x: pad, y: pad, w: cw - pad * 2, h: ch * 0.38, align, verticalAnchor: "top" };
    case "left":
      return { x: pad, y: ch * 0.1, w: cw * 0.45 - pad, h: ch * 0.8, align: "left", verticalAnchor: "center" };
    case "right":
      return { x: cw * 0.55, y: ch * 0.1, w: cw * 0.45 - pad, h: ch * 0.8, align: "right", verticalAnchor: "center" };
    case "center":
      return { x: cw * 0.1, y: ch * 0.2, w: cw * 0.8, h: ch * 0.6, align: "center", verticalAnchor: "center" };
    default: // bottom — zone ends at 85% height (15% bottom margin)
      return { x: pad, y: ch * 0.45, w: cw - pad * 2, h: ch * 0.40, align, verticalAnchor: "bottom" };
  }
}

// ── Tamanhos ──────────────────────────────────────────────────────────────────

function headlineFontSize(ch: number): number {
  // 10% da altura do canvas, clamp entre 32px e 180px
  return Math.max(32, Math.min(180, Math.round(ch * 0.10)));
}

function subheadlineFontSize(cw: number): number {
  return Math.max(14, Math.min(36, Math.round(cw * 0.028)));
}

// ── Wrap de texto ──────────────────────────────────────────────────────────────

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // máx 3 linhas
}

// ── Efeitos por preset ────────────────────────────────────────────────────────

function applyShadow(
  ctx: CanvasRenderingContext2D,
  shadow: TextPresetConfig["effects"]["shadow"],
  color = "rgba(0,0,0,0.9)"
): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  switch (shadow) {
    case "soft":
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      break;
    case "medium":
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 3;
      break;
    case "hard":
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      break;
    case "multi-layer":
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      break;
  }
}

function applyGlow(
  ctx: CanvasRenderingContext2D,
  glowColor: string,
  intensity: number
): void {
  const blur = Math.round(intensity / 5);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = blur;
}

// ── Renderizador principal ────────────────────────────────────────────────────

/**
 * Renderiza textos sobre um CanvasRenderingContext2D existente.
 * Não cria canvas — recebe um ctx já com a imagem base desenhada.
 */
export function renderTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  config: TextRenderConfig
): void {
  const { texts, presetConfig, colors, composition, canvasWidth: cw, canvasHeight: ch } = config;
  const zone = resolveTextZone(composition, cw, ch);
  const preset = presetConfig.stylePreset;
  const accentColor = colors.accentWord ?? colors.primary;
  const hlSize = headlineFontSize(ch);
  const shSize = subheadlineFontSize(cw);
  const ctaSize = Math.max(12, Math.round(hlSize * 0.35)); // 35% of headline
  const fontName = presetConfig.headlineFont;
  const lineH = hlSize * presetConfig.headlineLineHeight;

  ctx.save();
  ctx.textAlign = zone.align;
  const xAnchor =
    zone.align === "center"
      ? zone.x + zone.w / 2
      : zone.align === "right"
      ? zone.x + zone.w
      : zone.x;

  let currentY = zone.y;
  if (zone.verticalAnchor === "bottom") {
    // Estimar altura total e começar de baixo
    const hlLines = wrapText(
      ctx,
      (presetConfig.headlineTransform === "uppercase"
        ? texts.headline.toUpperCase()
        : texts.headline),
      zone.w
    );
    const totalH =
      hlLines.length * lineH +
      (texts.subheadline ? shSize * 1.6 : 0) +
      (texts.cta ? 12 + ctaSize * 1.5 : 0);
    currentY = zone.y + zone.h - totalH;
  }

  // ── Headline ─────────────────────────────────────────────────────────────────

  if (texts.headline) {
    const hl =
      presetConfig.headlineTransform === "uppercase"
        ? texts.headline.toUpperCase()
        : texts.headline;

    const fontStr = `${presetConfig.headlineWeight} ${hlSize}px "${fontName}", sans-serif`;
    ctx.font = fontStr;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "-0.02em";

    const lines = wrapText(ctx, hl, zone.w);
    const accentParts = getAccentParts(hl, presetConfig.accentWordAuto);

    for (let i = 0; i < lines.length; i++) {
      const lineY = currentY + i * lineH + hlSize;
      const line = lines[i];
      const isAccentLine = i === lines.length - 1 && accentParts.accent;

      // Glow
      if (presetConfig.effects.glow) {
        const gc = presetConfig.effects.glowColor ?? colors.primary;
        applyGlow(ctx, gc, presetConfig.effects.glowIntensity);
      }

      // Shadow
      if (presetConfig.effects.shadow !== "none" && !presetConfig.effects.glow) {
        applyShadow(ctx, presetConfig.effects.shadow);
      }

      // Gradient no texto
      if (presetConfig.effects.gradient && presetConfig.effects.gradientColors?.length) {
        const stops = presetConfig.effects.gradientColors;
        const grad = ctx.createLinearGradient(zone.x, lineY - hlSize, zone.x, lineY);
        stops.forEach((c, idx) => grad.addColorStop(idx / (stops.length - 1), c));
        ctx.fillStyle = grad;
      } else if (preset === "minimal") {
        ctx.fillStyle = "#111111";
      } else {
        ctx.fillStyle = "#ffffff";
      }

      // Stroke
      if (presetConfig.effects.stroke) {
        ctx.strokeStyle = presetConfig.effects.strokeColor ?? colors.primary;
        ctx.lineWidth = presetConfig.effects.strokeWidth ?? 2;
        ctx.strokeText(line, xAnchor, lineY);
      }

      // Accent word na última linha
      if (isAccentLine && accentParts.accent) {
        // Mede o before para posicionar o accent
        const { before, accent, after } = accentParts;
        // Renderiza linha completa em branco primeiro
        ctx.fillText(line, xAnchor, lineY);
        // Sobrescreve a parte do accent com a cor de acento
        if (accent && zone.align !== "center") {
          const beforeW = ctx.measureText(before + (before ? " " : "")).width;
          const accentX =
            zone.align === "right"
              ? xAnchor - ctx.measureText(line).width + beforeW
              : xAnchor + beforeW;
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.fillStyle = accentColor;
          ctx.fillText(accent, accentX, lineY);
        }
      } else {
        ctx.fillText(line, xAnchor, lineY);
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    currentY += lines.length * lineH + hlSize * 0.3;
  }

  // ── Subheadline ───────────────────────────────────────────────────────────────

  if (texts.subheadline) {
    ctx.font = `300 ${shSize}px "${presetConfig.bodyFont}", sans-serif`;
    ctx.fillStyle =
      preset === "dark" ? `rgba(0,229,255,0.8)` : "rgba(255,255,255,0.85)";
    applyShadow(ctx, "soft");
    ctx.fillText(texts.subheadline, xAnchor, currentY + shSize);
    ctx.shadowBlur = 0;
    currentY += shSize * 1.6;
  }

  // ── CTA ───────────────────────────────────────────────────────────────────────

  if (texts.cta) {
    currentY += 12; // fixed 12px spacing from headline/subheadline
    ctx.font = `600 ${ctaSize}px "${presetConfig.bodyFont}", sans-serif`;
    ctx.fillStyle = colors.accentWord ?? `rgba(255,255,255,0.70)`;
    ctx.shadowColor = "transparent";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.15em";
    ctx.fillText(texts.cta.toUpperCase(), xAnchor, currentY + ctaSize);
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

    // Underline para preset clean
    if (preset === "clean") {
      const ctaWidth = ctx.measureText(texts.cta.toUpperCase()).width;
      const lineX =
        zone.align === "center"
          ? xAnchor - ctaWidth / 2
          : zone.align === "right"
          ? xAnchor - ctaWidth
          : xAnchor;
      ctx.beginPath();
      ctx.moveTo(lineX, currentY + ctaSize + 3);
      ctx.lineTo(lineX + ctaWidth, currentY + ctaSize + 3);
      ctx.strokeStyle = colors.accentWord ?? `rgba(255,255,255,0.70)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  ctx.restore();
}
