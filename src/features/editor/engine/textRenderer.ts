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
  /** Quando true, posiciona headline no terço superior (acima do subject) */
  foodPopOverlay?: boolean;
  /** Quando true, não renderiza CTA standalone (CTA já está dentro do price badge) */
  skipCta?: boolean;
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
  ch: number,
  foodPopOverlay = false
): TextZone {
  const pad = cw * 0.08;

  // Food Pop: headline sempre no terço superior, centralizada, acima do subject
  if (foodPopOverlay) {
    return { x: pad, y: ch * 0.05, w: cw - pad * 2, h: ch * 0.20, align: "center", verticalAnchor: "top" };
  }

  const pos = comp.textPosition ?? "bottom";
  const align = (comp.textAlignment ?? "left") as CanvasTextAlign;

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

// ── Food Pop: multi-layer headline shadow ──────────────────────────────────────

/**
 * Desenha o texto 4× com shadow progressivo, criando profundidade tridimensional.
 * Apenas para o modo food pop — não afeta presets padrão.
 */
function drawHeadlineMultiLayer(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
): void {
  // Layer 1 — contorno sutil
  ctx.shadowColor = "rgba(0, 0, 0, 0.30)"; ctx.shadowBlur = 2; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
  ctx.fillText(text, x, y);
  // Layer 2 — profundidade
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)"; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
  ctx.fillText(text, x, y);
  // Layer 3 — ambiente
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)"; ctx.shadowBlur = 20; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 6;
  ctx.fillText(text, x, y);
  // Layer 4 — texto final limpo (sem shadow)
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.fillText(text, x, y);
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
  const foodPop = config.foodPopOverlay ?? false;
  const zone = resolveTextZone(composition, cw, ch, config.foodPopOverlay);
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
    // Accent parts computed from LAST LINE to avoid cross-line word duplication.
    // "SMASH BURGER ARTESANAL" wraps to ["SMASH BURGER", "ARTESANAL"]:
    // accentParts of full text = {before:"SMASH", accent:"BURGER ARTESANAL"}
    // but last line is only "ARTESANAL" — so we compute from last line directly.
    const accentParts = getAccentParts(lines[lines.length - 1], presetConfig.accentWordAuto);

    for (let i = 0; i < lines.length; i++) {
      const lineY = currentY + i * lineH + hlSize;
      const line = lines[i];
      const isAccentLine = i === lines.length - 1 && accentParts.accent;

      // Glow/Shadow — apenas para presets padrão (foodPop tem multi-layer próprio)
      if (!foodPop) {
        if (presetConfig.effects.glow) {
          const gc = presetConfig.effects.glowColor ?? colors.primary;
          applyGlow(ctx, gc, presetConfig.effects.glowIntensity);
        }
        if (presetConfig.effects.shadow !== "none" && !presetConfig.effects.glow) {
          applyShadow(ctx, presetConfig.effects.shadow);
        }
      }

      // Fill style (gradient ou cor sólida)
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

      if (isAccentLine) {
        const { before, accent } = accentParts;
        const beforeText = before ? before + " " : "";
        const beforeWidth = ctx.measureText(beforeText).width;
        const fullLineWidth = ctx.measureText(line).width;
        let lineStartX: number;
        if (zone.align === "center") {
          lineStartX = xAnchor - fullLineWidth / 2;
        } else if (zone.align === "right") {
          lineStartX = xAnchor - fullLineWidth;
        } else {
          lineStartX = xAnchor;
        }

        ctx.save();
        ctx.textAlign = "left";

        // Segmento "before"
        if (beforeText) {
          if (foodPop) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = cw * 0.002;
            ctx.lineJoin = "round";
            ctx.strokeText(beforeText, lineStartX, lineY);
            drawHeadlineMultiLayer(ctx, beforeText, lineStartX, lineY);
          } else {
            if (presetConfig.effects.stroke) {
              ctx.strokeStyle = presetConfig.effects.strokeColor ?? colors.primary;
              ctx.lineWidth = presetConfig.effects.strokeWidth ?? 2;
              ctx.strokeText(beforeText, lineStartX, lineY);
            }
            ctx.fillText(beforeText, lineStartX, lineY);
          }
        }

        // Segmento accent
        if (foodPop) {
          // Glow colorido na cor do accent + passada limpa para texto sólido
          ctx.fillStyle = accentColor;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(accent, lineStartX + beforeWidth, lineY);
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.fillText(accent, lineStartX + beforeWidth, lineY);
        } else {
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = accentColor;
          if (presetConfig.effects.stroke) {
            ctx.strokeText(accent, lineStartX + beforeWidth, lineY);
          }
          ctx.fillText(accent, lineStartX + beforeWidth, lineY);
        }

        ctx.restore();
      } else {
        if (foodPop) {
          // Stroke de definição sutil + multi-layer shadow
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = cw * 0.002;
          ctx.lineJoin = "round";
          ctx.strokeText(line, xAnchor, lineY);
          drawHeadlineMultiLayer(ctx, line, xAnchor, lineY);
        } else {
          if (presetConfig.effects.stroke) {
            ctx.strokeStyle = presetConfig.effects.strokeColor ?? colors.primary;
            ctx.lineWidth = presetConfig.effects.strokeWidth ?? 2;
            ctx.strokeText(line, xAnchor, lineY);
          }
          ctx.fillText(line, xAnchor, lineY);
        }
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
    if (foodPop) {
      ctx.font = `500 ${shSize}px Montserrat, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.08em";
      ctx.fillText(texts.subheadline, xAnchor, currentY + shSize);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    } else {
      ctx.font = `300 ${shSize}px "${presetConfig.bodyFont}", sans-serif`;
      ctx.fillStyle =
        preset === "dark" ? `rgba(0,229,255,0.8)` : "rgba(255,255,255,0.85)";
      applyShadow(ctx, "soft");
      ctx.fillText(texts.subheadline, xAnchor, currentY + shSize);
      ctx.shadowBlur = 0;
    }
    currentY += shSize * 1.6;
  }

  // ── CTA ───────────────────────────────────────────────────────────────────────

  if (texts.cta && !config.skipCta) {
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

// ── Food Pop: Price Badge ──────────────────────────────────────────────────────

/**
 * Renderiza badge de preço no canto inferior direito.
 * Chamado APÓS renderTextOnCanvas, condicionado a ter price no state.
 */
export function renderPriceBadge(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  price: { value: string; prefix: string; suffix: string },
  cta: string | undefined,
  accentColor: string
): void {
  console.log('[Creatyng] renderPriceBadge called with:', price);
  const cw = canvas.width;
  const ch = canvas.height;

  const badgeWidth = cw * 0.22;
  const badgeHeight = ch * 0.18;
  const badgeX = cw * 0.75;   // margem direita ~3%
  const badgeY = ch * 0.62;   // base do badge a 20% do fundo (zona de gradiente escuro)

  ctx.save();

  // Fundo do badge com rounded corners
  const radius = badgeWidth * 0.06;
  ctx.beginPath();
  ctx.moveTo(badgeX + radius, badgeY);
  ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
  ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
  ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
  ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
  ctx.lineTo(badgeX, badgeY + radius);
  ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
  ctx.closePath();
  ctx.fillStyle = "rgba(20, 12, 5, 0.88)";
  ctx.fill();

  // Badge border
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const priceSize = badgeWidth * 0.35;
  const prefixSize = priceSize * 0.35;
  const centerX = badgeX + badgeWidth / 2;

  // Parte inteira e centavos do valor
  const valueParts = price.value.split(/[,.]/);
  const mainValue = valueParts[0] || price.value;
  const cents = valueParts[1] || "";

  // Valor principal (com glow sutil)
  ctx.font = `900 ${priceSize}px Montserrat, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(255,255,255,0.2)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const priceY = badgeY + badgeHeight * 0.5;
  ctx.fillText(mainValue, centerX, priceY);
  ctx.shadowBlur = 0;

  // Mede a largura do valor principal para posicionar prefixo e centavos
  const mainWidth = ctx.measureText(mainValue).width;

  // Prefixo (R$, etc.)
  if (price.prefix) {
    ctx.font = `700 ${prefixSize}px Montserrat, sans-serif`;
    ctx.fillStyle = accentColor || "#FFD700";
    ctx.textAlign = "right";
    ctx.fillText(price.prefix, centerX - mainWidth / 2 - 4, priceY - priceSize * 0.2);
  }

  // Centavos
  if (cents) {
    ctx.font = `700 ${prefixSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(`,${cents}`, centerX + mainWidth / 2 + 2, priceY - priceSize * 0.2);
  }

  // Sufixo (CADA, A PARTIR DE, etc.)
  if (price.suffix) {
    ctx.font = `600 ${badgeWidth * 0.065}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.textAlign = "center";
    ctx.fillText(price.suffix.toUpperCase(), centerX, priceY + priceSize * 0.25);
  }

  // Barra do CTA dentro do badge
  if (cta) {
    const ctaH = badgeHeight * 0.18;
    const ctaY = badgeY + badgeHeight - ctaH - badgeHeight * 0.08;
    const ctaPad = badgeWidth * 0.08;

    ctx.beginPath();
    const ctaRadius = ctaH * 0.4;
    const ctaX = badgeX + ctaPad;
    const ctaW = badgeWidth - ctaPad * 2;
    ctx.moveTo(ctaX + ctaRadius, ctaY);
    ctx.lineTo(ctaX + ctaW - ctaRadius, ctaY);
    ctx.quadraticCurveTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + ctaRadius);
    ctx.lineTo(ctaX + ctaW, ctaY + ctaH - ctaRadius);
    ctx.quadraticCurveTo(ctaX + ctaW, ctaY + ctaH, ctaX + ctaW - ctaRadius, ctaY + ctaH);
    ctx.lineTo(ctaX + ctaRadius, ctaY + ctaH);
    ctx.quadraticCurveTo(ctaX, ctaY + ctaH, ctaX, ctaY + ctaH - ctaRadius);
    ctx.lineTo(ctaX, ctaY + ctaRadius);
    ctx.quadraticCurveTo(ctaX, ctaY, ctaX + ctaRadius, ctaY);
    ctx.closePath();
    ctx.fillStyle = "#E53935";
    ctx.fill();

    ctx.font = `800 ${ctaH * 0.55}px Montserrat, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.1em";
    ctx.fillText(cta.toUpperCase(), centerX, ctaY + ctaH * 0.68);
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }

  ctx.restore();
}

// ── Food Pop: Contact Bar ──────────────────────────────────────────────────────

/**
 * Renderiza barra de contatos (WhatsApp + Instagram) na base da imagem.
 * Chamado APÓS renderTextOnCanvas, condicionado a ter whatsapp/instagram no state.
 */
export function renderContactBar(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  whatsapp: string | undefined,
  instagram: string | undefined
): void {
  console.log('[Creatyng] renderContactBar called with:', { whatsapp, instagram });
  if (!whatsapp && !instagram) return;

  const cw = canvas.width;
  const ch = canvas.height;

  const barY = ch * 0.94;
  const fontSize = cw * 0.022;
  const iconSize = fontSize * 1.3;
  const gap = cw * 0.04;

  ctx.save();
  ctx.font = `400 ${fontSize}px Montserrat, sans-serif`;
  ctx.textBaseline = "middle";

  // Calcular largura total para centralizar
  let totalWidth = 0;
  if (whatsapp) totalWidth += iconSize + 6 + ctx.measureText(whatsapp).width;
  if (whatsapp && instagram) totalWidth += gap;
  if (instagram) {
    const handle = instagram.startsWith("@") ? instagram : `@${instagram}`;
    totalWidth += iconSize + 6 + ctx.measureText(handle).width;
  }

  let currentX = (cw - totalWidth) / 2;

  // WhatsApp
  if (whatsapp) {
    ctx.beginPath();
    ctx.arc(currentX + iconSize / 2, barY, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(37, 211, 102, 0.85)";
    ctx.fill();

    ctx.font = `700 ${iconSize * 0.5}px sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("✆", currentX + iconSize / 2, barY + 1);

    currentX += iconSize + 6;
    ctx.font = `400 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.textAlign = "left";
    ctx.fillText(whatsapp, currentX, barY);
    currentX += ctx.measureText(whatsapp).width + gap;
  }

  // Instagram
  if (instagram) {
    ctx.beginPath();
    ctx.arc(currentX + iconSize / 2, barY, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(225, 48, 108, 0.85)";
    ctx.fill();

    ctx.font = `700 ${iconSize * 0.5}px sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("📷", currentX + iconSize / 2, barY + 1);

    currentX += iconSize + 6;
    ctx.font = `400 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.textAlign = "left";
    const handle = instagram.startsWith("@") ? instagram : `@${instagram}`;
    ctx.fillText(handle, currentX, barY);
  }

  ctx.restore();
}
