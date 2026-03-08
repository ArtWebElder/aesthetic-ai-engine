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

// ── Food Pop: tipografia composta (segmentos com peso/tamanho variáveis) ─────────

interface HeadlineSegment {
  text: string;
  weight: number;       // 300-900
  sizeFactor: number;   // multiplicador do baseSize (0.6–1.2)
  font: "display" | "body";
  isAccent: boolean;    // true = linha de impacto
}

const CONNECTOR_WORDS = new Set([
  "DO", "DA", "DE", "DAS", "DOS", "EM", "NO", "NA", "NOS", "NAS",
  "COM", "SEM", "POR", "PARA", "E", "OU", "QUE", "SEU", "SUA",
  "O", "A", "OS", "AS", "UM", "UMA", "AO", "À",
  "THE", "OF", "AND", "FOR", "TO", "IN", "ON", "AT", "YOUR", "OUR",
]);

/**
 * Divide a headline em dois segmentos tipográficos.
 * Regra: a primeira palavra costuma ser o PRODUTO → grande e bold (impacto).
 * Se a headline começa com connector word → contexto primeiro, impacto depois.
 * O destaque vem de TAMANHO e PESO, não de cor.
 */
function segmentHeadline(headline: string): HeadlineSegment[] {
  const words = headline.toUpperCase().trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return [];

  if (words.length === 1) {
    return [{ text: words[0], weight: 800, sizeFactor: 1.0, font: "display", isAccent: true }];
  }

  if (words.length === 2) {
    // Primeira palavra é produto: SUSHI PREMIUM, PIZZA ARTESANAL
    return [
      { text: words[0], weight: 800, sizeFactor: 1.0,  font: "display", isAccent: true  },
      { text: words[1], weight: 500, sizeFactor: 0.45, font: "body",    isAccent: false },
    ];
  }

  // 3+ palavras
  const startsWithConnector = CONNECTOR_WORDS.has(words[0]);

  if (startsWithConnector) {
    // "DO TAMANHO DA SUA FOME" → contexto primeiro, impacto no fim
    let splitIndex = words.length;
    for (let i = words.length - 1; i >= 1; i--) {
      if (CONNECTOR_WORDS.has(words[i])) {
        splitIndex = i + 1;
        break;
      }
    }
    // Garantir pelo menos 2 palavras no impacto quando possível
    if (words.length - splitIndex < 2 && splitIndex > 2) {
      splitIndex = Math.max(1, splitIndex - 1);
    }
    splitIndex = Math.max(1, Math.min(splitIndex, words.length - 1));
    return [
      { text: words.slice(0, splitIndex).join(" "), weight: 500, sizeFactor: 0.45, font: "body",    isAccent: false },
      { text: words.slice(splitIndex).join(" "),    weight: 800, sizeFactor: 1.0,  font: "display", isAccent: true  },
    ];
  } else {
    // "AÇAÍ DO SEU JEITO", "SMASH BURGER ARTESANAL"
    // Produto = palavras antes do primeiro connector; resto = contexto
    let splitIndex = words.length;
    for (let i = 1; i < words.length; i++) {
      if (CONNECTOR_WORDS.has(words[i])) {
        splitIndex = i;
        break;
      }
    }
    splitIndex = Math.max(1, Math.min(splitIndex, words.length - 1));
    return [
      { text: words.slice(0, splitIndex).join(" "), weight: 800, sizeFactor: 1.0,  font: "display", isAccent: true  },
      { text: words.slice(splitIndex).join(" "),    weight: 500, sizeFactor: 0.45, font: "body",    isAccent: false },
    ];
  }
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

// ── Food Pop: renderizador de headline composta ───────────────────────────────

/**
 * Renderiza headline como dois segmentos tipográficos independentes.
 * Hierarquia criada por TAMANHO e PESO — não por cor.
 * Retorna o Y imediatamente abaixo do último segmento.
 */
function renderComposedHeadline(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  headline: string,
  baseSize: number,
  startY: number,
  displayFont: string,
  bodyFont: string
): number {
  const segments = segmentHeadline(headline);
  let currentY = startY;
  ctx.save();
  ctx.textAlign = "center";
  const centerX = canvas.width / 2;
  const maxWidth = canvas.width * 0.84; // same padding as resolveTextZone

  for (const seg of segments) {
    const fontSize = baseSize * seg.sizeFactor;
    const fontFamily = seg.font === "display" ? displayFont : bodyFont;
    // Impacto com italic — dá dinâmica sem ser agressivo; contexto sem italic — contraste
    const fontStyle = seg.isAccent ? "italic " : "";
    ctx.font = `${fontStyle}${seg.weight} ${fontSize}px "${fontFamily}", sans-serif`;

    // Split long context lines so they don't overflow
    const lines = wrapText(ctx, seg.text, maxWidth);

    for (const line of lines) {
      if (seg.isAccent) {
        // Impact segment — elegant shadow, white text
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = "#FFFFFF";
      } else {
        // Context segment — legível, não invisível. Hierarquia por tamanho, não por apagar.
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
      }

      ctx.fillText(line, centerX, currentY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const lineHeight = seg.isAccent ? 0.95 : 1.1;
      currentY += fontSize * lineHeight;
    }

    // Small gap between segments
    currentY += baseSize * 0.08;
  }

  ctx.restore();
  return currentY;
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
    // Food Pop: renderizar como dois segmentos tipográficos (contexto + impacto)
    if (foodPop) {
      const hlStartY = currentY + hlSize * 0.9;
      currentY = renderComposedHeadline(
        ctx,
        { width: cw, height: ch },
        texts.headline,
        hlSize,
        hlStartY,
        presetConfig.headlineFont,
        presetConfig.bodyFont,
      );
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    } else {

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
    } // end else (non food-pop)
  }

  // ── Subheadline ───────────────────────────────────────────────────────────────

  if (texts.subheadline) {
    if (foodPop) {
      // Subheadline food-pop: menor que headline mas visível e presente.
      const subFoodSize = Math.max(13, Math.round(hlSize * 0.28));
      ctx.font = `500 ${subFoodSize}px Montserrat, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.06em";
      ctx.fillText(texts.subheadline, cw / 2, currentY + subFoodSize * 0.8);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
      ctx.textAlign = zone.align; // restore
      currentY += subFoodSize * 1.4;
    } else {
      ctx.font = `300 ${shSize}px "${presetConfig.bodyFont}", sans-serif`;
      ctx.fillStyle =
        preset === "dark" ? `rgba(0,229,255,0.8)` : "rgba(255,255,255,0.85)";
      applyShadow(ctx, "soft");
      ctx.fillText(texts.subheadline, xAnchor, currentY + shSize);
      ctx.shadowBlur = 0;
      currentY += shSize * 1.6;
    }
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

// ── Food Pop: tipos compartilhados ────────────────────────────────────────────

interface FoodPaletteLocal {
  accent: string;
  accentLight: string;
  badgeBg: string;
  badgeText: string;
  ctaBg: string;
  ctaText: string;
}

// ── Food Pop: hash determinístico para variação ────────────────────────────────

function simpleHash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export type BadgeVariant = "card-right" | "card-left" | "pill-bottom" | "minimal-inline";

export function chooseBadgeVariant(headline: string, priceValue: string): BadgeVariant {
  const variants: BadgeVariant[] = ["card-right", "card-left", "pill-bottom", "minimal-inline"];
  return variants[simpleHash((headline + priceValue).toLowerCase()) % variants.length];
}

// ── Food Pop: sub-renderizadores de badge ─────────────────────────────────────

function renderCardBadge(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  price: { value: string; prefix: string; suffix: string },
  cta: string | undefined,
  accentColor: string,
  palette: FoodPaletteLocal | undefined,
  side: "left" | "right"
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const badgeWidth  = cw * 0.22;
  const badgeHeight = ch * 0.18;
  const badgeX = side === "right" ? cw * 0.75 : cw * 0.03;
  const badgeY = ch * 0.62;
  const badgeRadius = 12;

  const accent    = palette?.accent      ?? accentColor ?? "#D4A853";
  const accentLt  = palette?.accentLight ?? "rgba(255,255,255,0.12)";
  const bgColor   = palette?.badgeBg     ?? "rgba(255,255,255,0.92)";
  const textColor = palette?.badgeText   ?? "#1A1A1A";
  const ctaBgCol  = palette?.ctaBg       ?? accent;
  const ctaTxtCol = palette?.ctaText     ?? "#FFFFFF";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, accentLt);
  ctx.beginPath();
  roundRectPath(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();
  roundRectPath(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const priceSize  = badgeWidth * 0.35;
  const prefixSize = priceSize * 0.35;
  const centerX    = badgeX + badgeWidth / 2;
  const valueParts = price.value.split(/[,.]/);
  const mainValue  = valueParts[0] || price.value;
  const cents      = valueParts[1] || "";
  const priceY     = badgeY + badgeHeight * 0.50;

  ctx.font = `900 ${priceSize}px Montserrat, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.fillText(mainValue, centerX, priceY);
  const mainWidth = ctx.measureText(mainValue).width;

  if (price.prefix) {
    ctx.font = `700 ${prefixSize}px Montserrat, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = "right";
    ctx.fillText(price.prefix, centerX - mainWidth / 2 - 4, priceY - priceSize * 0.2);
  }
  if (cents) {
    ctx.font = `700 ${prefixSize}px Montserrat, sans-serif`;
    ctx.fillStyle = textColor + "AA";
    ctx.textAlign = "left";
    ctx.fillText(`,${cents}`, centerX + mainWidth / 2 + 2, priceY - priceSize * 0.2);
  }
  if (price.suffix) {
    ctx.font = `600 ${badgeWidth * 0.065}px Montserrat, sans-serif`;
    ctx.fillStyle = textColor + "99";
    ctx.textAlign = "center";
    ctx.fillText(price.suffix.toUpperCase(), centerX, priceY + priceSize * 0.25);
  }
  if (cta) {
    const ctaH   = badgeHeight * 0.17;
    const ctaY   = badgeY + badgeHeight - ctaH - badgeHeight * 0.08;
    const ctaPad = badgeWidth * 0.06;
    const ctaX   = badgeX + ctaPad;
    const ctaW   = badgeWidth - ctaPad * 2;
    ctx.save();
    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY);
    ctaGrad.addColorStop(0, ctaBgCol);
    ctaGrad.addColorStop(1, adjustBrightness(ctaBgCol, -18));
    ctx.beginPath();
    roundRectPath(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fillStyle = ctaGrad;
    ctx.fill();
    ctx.font = `600 ${ctaH * 0.50}px Montserrat, sans-serif`;
    ctx.fillStyle = ctaTxtCol;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.10em";
    ctx.fillText(cta.toUpperCase(), centerX, ctaY + ctaH / 2);
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    ctx.restore();
  }
  ctx.restore();
}

function renderPillBadge(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  price: { value: string; prefix: string; suffix: string },
  cta: string | undefined,
  palette: FoodPaletteLocal | undefined
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const pillW = cw * 0.65;
  const pillH = ch * 0.055;
  const pillX = (cw - pillW) / 2;
  const pillY = ch * 0.83;
  const pillRadius = pillH / 2;

  const accent    = palette?.accent    ?? "#D4A853";
  const bgColor   = palette?.badgeBg   ?? "rgba(255,255,255,0.92)";
  const accentLt  = palette?.accentLight ?? "rgba(255,248,240,0.88)";
  const textColor = palette?.badgeText ?? "#1A1A1A";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, accentLt);
  ctx.beginPath();
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillRadius);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.beginPath();
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillRadius);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const priceSize = pillH * 0.36;
  const centerY   = pillY + pillH / 2;
  const priceX    = pillX + pillW * 0.25;
  const priceText = `${price.prefix ? price.prefix + " " : ""}${price.value}`;

  ctx.textBaseline = "middle";
  ctx.font = `700 ${priceSize}px Montserrat, sans-serif`;
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.fillText(priceText, priceX, centerY);

  if (price.suffix) {
    const sufSize = pillH * 0.22;
    const sufX = priceX + ctx.measureText(priceText).width / 2 + cw * 0.015;
    ctx.font = `500 ${sufSize}px Montserrat, sans-serif`;
    ctx.fillStyle = textColor + "AA";
    ctx.textAlign = "left";
    ctx.fillText(price.suffix.toUpperCase(), sufX, centerY);
  }

  // Separador vertical
  const sepX = pillX + pillW * 0.55;
  ctx.beginPath();
  ctx.moveTo(sepX, pillY + pillH * 0.2);
  ctx.lineTo(sepX, pillY + pillH * 0.8);
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (cta) {
    const ctaSize = pillH * 0.30;
    const ctaX    = pillX + pillW * 0.78;
    ctx.font = `600 ${ctaSize}px Montserrat, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.08em";
    ctx.fillText(cta.toUpperCase(), ctaX, centerY);
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }

  ctx.restore();
}

function renderMinimalPrice(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  price: { value: string; prefix: string; suffix: string },
  cta: string | undefined,
  palette: FoodPaletteLocal | undefined
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const centerX  = cw / 2;
  const priceY   = ch * 0.78;
  const priceSize = cw * 0.065;
  const accent   = palette?.accent ?? "#D4A853";

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.50)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  const priceText = `${price.prefix ? price.prefix + " " : ""}${price.value}`;
  ctx.font = `800 ${priceSize}px Montserrat, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(priceText, centerX, priceY);

  if (price.suffix) {
    ctx.font = `400 ${priceSize * 0.35}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.fillText(price.suffix.toUpperCase(), centerX, priceY + priceSize * 0.5);
  }

  if (cta) {
    const ctaY = priceY + priceSize * (price.suffix ? 0.9 : 0.6);
    ctx.font = `600 ${priceSize * 0.4}px Montserrat, sans-serif`;
    ctx.fillStyle = accent;
    ctx.shadowColor = "rgba(0,0,0,0.40)";
    ctx.shadowBlur = 6;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.08em";
    ctx.fillText(`${cta.toUpperCase()}  →`, centerX, ctaY);
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }

  ctx.restore();
}

// ── Food Pop: Price Badge (dispatcher) ────────────────────────────────────────

/**
 * Escolhe variante de badge por hash determinístico e despacha para sub-renderizador.
 * headline param necessário para que o hash varie entre criativos diferentes.
 */
export function renderPriceBadge(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  price: { value: string; prefix: string; suffix: string },
  cta: string | undefined,
  accentColor: string,
  palette?: FoodPaletteLocal,
  headline?: string
): void {
  console.log('[Creatyng] renderPriceBadge called with:', price);
  const variant = chooseBadgeVariant(headline ?? "", price.value);
  switch (variant) {
    case "card-right":
      renderCardBadge(ctx, canvas, price, cta, accentColor, palette, "right");
      break;
    case "card-left":
      renderCardBadge(ctx, canvas, price, cta, accentColor, palette, "left");
      break;
    case "pill-bottom":
      renderPillBadge(ctx, canvas, price, cta, palette);
      break;
    case "minimal-inline":
      renderMinimalPrice(ctx, canvas, price, cta, palette);
      break;
  }
}

// ── Food Pop: Contact Bar ──────────────────────────────────────────────────────

export type ContactVariant = "bar-center" | "bar-left" | "inline-badge";

export function chooseContactVariant(whatsapp: string, instagram: string): ContactVariant {
  const variants: ContactVariant[] = ["bar-center", "bar-left", "inline-badge"];
  return variants[simpleHash((whatsapp + instagram).toLowerCase()) % variants.length];
}

// Variante 1: centralizada (original)
function renderContactCenter(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  whatsapp: string | undefined,
  instagram: string | undefined,
  palette: FoodPaletteLocal | undefined
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const barY     = ch * 0.94;
  const fontSize = cw * 0.022;
  const iconSize = fontSize * 1.3;
  const gap      = cw * 0.04;
  const accent   = palette?.accent;
  const waIconColor = accent ? accent + "CC" : "rgba(37,211,102,0.80)";
  const igIconColor = accent ? accent + "99" : "rgba(225,48,108,0.80)";

  ctx.save();
  ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
  ctx.textBaseline = "middle";

  let totalWidth = 0;
  if (whatsapp) totalWidth += iconSize + 6 + ctx.measureText(whatsapp).width;
  if (whatsapp && instagram) totalWidth += gap;
  if (instagram) {
    const handle = instagram.startsWith("@") ? instagram : `@${instagram}`;
    totalWidth += iconSize + 6 + ctx.measureText(handle).width;
  }
  let currentX = (cw - totalWidth) / 2;

  function shadow(): void {
    ctx.shadowColor = "rgba(0,0,0,0.50)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  }

  if (whatsapp) {
    const cx = currentX + iconSize / 2;
    ctx.beginPath();
    ctx.arc(cx, barY, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = waIconColor;
    ctx.shadowColor = "rgba(0,0,0,0.30)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = `800 ${iconSize * 0.50}px Montserrat, sans-serif`;
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
    ctx.fillText("W", cx, barY + iconSize * 0.17);
    currentX += iconSize + 6;
    ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.textAlign = "left";
    shadow();
    ctx.fillText(whatsapp, currentX, barY);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    currentX += ctx.measureText(whatsapp).width + gap;
  }
  if (instagram) {
    const cx = currentX + iconSize / 2;
    ctx.beginPath();
    ctx.arc(cx, barY, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = igIconColor;
    ctx.shadowColor = "rgba(0,0,0,0.30)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = `800 ${iconSize * 0.50}px Montserrat, sans-serif`;
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
    ctx.fillText("@", cx, barY + iconSize * 0.17);
    currentX += iconSize + 6;
    ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.textAlign = "left";
    shadow();
    const handle = instagram.startsWith("@") ? instagram : `@${instagram}`;
    ctx.fillText(handle, currentX, barY);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  ctx.restore();
}

// Variante 2: esquerda, itens empilhados verticalmente
function renderContactLeft(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  whatsapp: string | undefined,
  instagram: string | undefined,
  palette: FoodPaletteLocal | undefined
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const startX   = cw * 0.05;
  const fontSize = cw * 0.022;
  const iconR    = fontSize * 0.5;
  const lineGap  = fontSize * 2.0;
  const accent   = palette?.accent;
  let currentY   = ch * (whatsapp && instagram ? 0.90 : 0.93);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.50)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  const items: { text: string; iconColor: string }[] = [];
  if (whatsapp) items.push({ text: whatsapp, iconColor: accent ? accent + "CC" : "rgba(37,211,102,0.80)" });
  if (instagram) {
    const handle = instagram.startsWith("@") ? instagram : `@${instagram}`;
    items.push({ text: handle, iconColor: accent ? accent + "99" : "rgba(225,48,108,0.80)" });
  }

  for (const item of items) {
    ctx.beginPath();
    ctx.arc(startX + iconR, currentY, iconR, 0, Math.PI * 2);
    ctx.fillStyle = item.iconColor;
    ctx.fill();
    ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(item.text, startX + iconR * 2 + 6, currentY);
    currentY += lineGap;
  }
  ctx.restore();
}

// Variante 3: pill semi-transparente na base
function renderContactBadge(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  whatsapp: string | undefined,
  instagram: string | undefined
): void {
  const cw = canvas.width;
  const ch = canvas.height;
  const fontSize = cw * 0.020;
  const barY     = ch * 0.93;
  const barH     = ch * 0.040;
  const items: string[] = [];
  if (whatsapp) items.push(whatsapp);
  if (instagram) items.push(instagram.startsWith("@") ? instagram : `@${instagram}`);
  const fullText = items.join("   •   ");

  ctx.save();
  ctx.font = `500 ${fontSize}px Montserrat, sans-serif`;
  const textWidth = ctx.measureText(fullText).width;
  const pillW     = textWidth + cw * 0.06;
  const pillX     = (cw - pillW) / 2;
  const pillRadius = barH / 2;

  ctx.beginPath();
  roundRectPath(ctx, pillX, barY - barH / 2, pillW, barH, pillRadius);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fullText, cw / 2, barY);
  ctx.restore();
}

/**
 * Renderiza contact bar com variante determinística por hash.
 * forceVariant sobrepõe a escolha automática (usado para resolução de conflito com badge).
 */
export function renderContactBar(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  whatsapp: string | undefined,
  instagram: string | undefined,
  paletteAccent?: string,
  palette?: FoodPaletteLocal,
  forceVariant?: ContactVariant
): void {
  console.log('[Creatyng] renderContactBar called with:', { whatsapp, instagram });
  if (!whatsapp && !instagram) return;

  const resolvedPalette = palette ?? (paletteAccent ? { accent: paletteAccent } as FoodPaletteLocal : undefined);
  const variant = forceVariant ?? chooseContactVariant(whatsapp ?? "", instagram ?? "");

  switch (variant) {
    case "bar-center":
      renderContactCenter(ctx, canvas, whatsapp, instagram, resolvedPalette);
      break;
    case "bar-left":
      renderContactLeft(ctx, canvas, whatsapp, instagram, resolvedPalette);
      break;
    case "inline-badge":
      renderContactBadge(ctx, canvas, whatsapp, instagram);
      break;
  }
}
