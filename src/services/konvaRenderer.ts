// src/services/konvaRenderer.ts
// CREATYNG — Renderiza overlay de texto profissional usando Konva.js (Canvas 2D offscreen).
// Substitui html2canvas com qualidade superior: sombras reais, gradientes em texto, badges com elevação.
// O renderer antigo (typographyRenderer.ts) é mantido como fallback.

import Konva from 'konva';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CopyData {
  headline: string;
  subheadline?: string;
  priceFormatted: string;
  priceBadgeText?: string;
  cta: string;
  tagline?: string;
}

interface CompositionLayout {
  textBlockPosition: string;
  textBlockX: number;
  textBlockY: number;
  textBlockMaxWidth: number;
  textAlign: string;
  verticalAlign?: string;
}

interface CompositionTextStyle {
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
  color: string;
  letterSpacing?: number;
  textTransform?: string;
  textShadow?: string;
  marginBottom?: number;
}

interface CompositionPriceStyle extends CompositionTextStyle {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: string;
  hasBadge?: boolean;
  badgeStyle?: string;
}

interface CompositionCtaStyle extends CompositionTextStyle {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: string;
}

interface CompositionBackdrop {
  enabled: boolean;
  type: string;
  css: string;
}

export interface CompositionData {
  layout: CompositionLayout;
  headline: CompositionTextStyle;
  subheadline?: CompositionTextStyle;
  price: CompositionPriceStyle;
  cta: CompositionCtaStyle;
  backdrop?: CompositionBackdrop;
  colorPalette?: Record<string, string>;
}

// ── Font pairing fallbacks ───────────────────────────────────────────────────

const FONT_PAIRINGS: Record<string, { display: string; body: string }> = {
  luxury:    { display: 'Playfair Display', body: 'DM Sans' },
  modern:    { display: 'Montserrat',       body: 'Inter' },
  bold:      { display: 'Bebas Neue',       body: 'Open Sans' },
  editorial: { display: 'Cormorant Garamond', body: 'Lato' },
  minimal:   { display: 'Josefin Sans',     body: 'Work Sans' },
  fun:       { display: 'Fredoka One',      body: 'Nunito' },
  tech:      { display: 'Space Grotesk',    body: 'IBM Plex Sans' },
  elegant:   { display: 'Libre Baskerville', body: 'Source Sans Pro' },
};

const DEFAULT_PAIRING = FONT_PAIRINGS.modern;

// ── Font loading ─────────────────────────────────────────────────────────────

async function loadGoogleFont(fontFamily: string, fontWeight: number = 400): Promise<boolean> {
  const cleanName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  if (!cleanName || cleanName === 'sans-serif' || cleanName === 'serif') return true;

  // Check if already available
  try {
    if (document.fonts.check(`${fontWeight} 16px "${cleanName}"`)) return true;
  } catch {
    // fonts.check can throw in some browsers — proceed with loading
  }

  // Inject Google Fonts stylesheet
  const linkId = `konva-font-${cleanName.replace(/\s+/g, '-').toLowerCase()}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@${fontWeight}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // Wait for the font to become available (timeout 3s)
  try {
    await Promise.race([
      document.fonts.load(`${fontWeight} 16px "${cleanName}"`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    // Extra settle time for browser to register the font
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch {
    console.warn(`[KonvaRenderer] Font "${cleanName}" failed to load — will use fallback`);
    return false;
  }
}

function getFallbackFont(tone?: string): string {
  const pairing = (tone && FONT_PAIRINGS[tone]) || DEFAULT_PAIRING;
  return pairing.display;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyTextTransform(text: string, transform?: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/\b\w/g, c => c.toUpperCase());
  }
  return text;
}

function parseCssRgba(css: string): { r: number; g: number; b: number; a: number } | null {
  const match = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

function konvaAlign(textAlign: string): 'left' | 'center' | 'right' {
  if (textAlign === 'center') return 'center';
  if (textAlign === 'right') return 'right';
  return 'left';
}

// ── Main renderer ────────────────────────────────────────────────────────────

export interface RenderWithKonvaParams {
  generatedImageBase64: string;
  compositionData: CompositionData;
  copyData: CopyData;
  canvasWidth: number;
  canvasHeight: number;
  tone?: string;
}

export async function renderWithKonva(params: RenderWithKonvaParams): Promise<string> {
  const { generatedImageBase64, compositionData, copyData, canvasWidth, canvasHeight, tone } = params;
  const layout = compositionData.layout;
  const hl = compositionData.headline;
  const sub = compositionData.subheadline;
  const price = compositionData.price;
  const cta = compositionData.cta;
  const backdrop = compositionData.backdrop;

  console.log('[KonvaRenderer] Starting render', canvasWidth, 'x', canvasHeight, 'at', layout.textBlockX, layout.textBlockY);

  // ── Load all required fonts ──────────────────────────────────────────────

  const fontResults = await Promise.all([
    loadGoogleFont(hl.fontFamily || 'Inter', hl.fontWeight),
    sub ? loadGoogleFont(sub.fontFamily || 'Inter', sub.fontWeight) : Promise.resolve(true),
    loadGoogleFont(price.fontFamily || hl.fontFamily || 'Inter', price.fontWeight),
    loadGoogleFont(cta.fontFamily || hl.fontFamily || 'Inter', cta.fontWeight),
  ]);

  // Resolve font families with fallback
  const fallback = getFallbackFont(tone);
  const hlFont = fontResults[0] ? (hl.fontFamily || 'Inter') : fallback;
  const subFont = fontResults[1] ? (sub?.fontFamily || 'Inter') : fallback;
  const priceFont = fontResults[2] ? (price.fontFamily || hl.fontFamily || 'Inter') : fallback;
  const ctaFont = fontResults[3] ? (cta.fontFamily || hl.fontFamily || 'Inter') : fallback;

  // ── Create offscreen Konva Stage ─────────────────────────────────────────

  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);

  const stage = new Konva.Stage({
    container,
    width: canvasWidth,
    height: canvasHeight,
  });

  try {
    // ── Layer 1: Background image ────────────────────────────────────────

    const bgLayer = new Konva.Layer();
    stage.add(bgLayer);

    const bgImgEl = new Image();
    bgImgEl.crossOrigin = 'anonymous';
    const imgSrc = generatedImageBase64.startsWith('data:')
      ? generatedImageBase64
      : `data:image/png;base64,${generatedImageBase64}`;
    bgImgEl.src = imgSrc;
    await new Promise<void>((resolve, reject) => {
      bgImgEl.onload = () => resolve();
      bgImgEl.onerror = () => reject(new Error('Failed to load background image'));
    });

    const bgImage = new Konva.Image({
      image: bgImgEl,
      width: canvasWidth,
      height: canvasHeight,
    });
    bgLayer.add(bgImage);

    // ── Layer 2: Text + backdrop ─────────────────────────────────────────

    const textLayer = new Konva.Layer();
    stage.add(textLayer);

    // ── Backdrop ─────────────────────────────────────────────────────────

    if (backdrop?.enabled) {
      const backdropY = layout.textBlockY - 40;
      const backdropHeight = canvasHeight - backdropY;

      if (backdrop.type === 'gradient' || backdrop.type === 'linear-gradient') {
        // Use colorPalette dominant color if available
        const dominant = compositionData.colorPalette?.dominant;
        const parsed = dominant ? parseCssRgba(dominant) : null;
        const r = parsed?.r ?? 0;
        const g = parsed?.g ?? 0;
        const b = parsed?.b ?? 0;

        const bdrop = new Konva.Rect({
          x: 0,
          y: backdropY,
          width: canvasWidth,
          height: backdropHeight,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: backdropHeight },
          fillLinearGradientColorStops: [
            0, `rgba(${r},${g},${b},0)`,
            0.3, `rgba(${r},${g},${b},0.4)`,
            1, `rgba(${r},${g},${b},0.85)`,
          ],
        });
        textLayer.add(bdrop);
      } else {
        // Solid backdrop
        const bdrop = new Konva.Rect({
          x: 0,
          y: backdropY,
          width: canvasWidth,
          height: backdropHeight,
          fill: 'rgba(0,0,0,0.5)',
        });
        textLayer.add(bdrop);
      }
    }

    // ── Headline ─────────────────────────────────────────────────────────

    let currentY = layout.textBlockY;
    const align = konvaAlign(layout.textAlign);

    const headlineText = new Konva.Text({
      x: layout.textBlockX,
      y: currentY,
      text: applyTextTransform(copyData.headline, hl.textTransform),
      fontSize: hl.fontSize,
      fontFamily: hlFont,
      fontStyle: hl.fontWeight >= 700 ? 'bold' : 'normal',
      fill: hl.color,
      letterSpacing: hl.letterSpacing ?? 0,
      width: layout.textBlockMaxWidth,
      align,
      lineHeight: 1.15,
      // Shadows
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 12,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowOpacity: 0.5,
    });

    // Gradient for premium/luxury tones
    if (tone === 'premium' || tone === 'elegante') {
      headlineText.fillLinearGradientStartPoint({ x: 0, y: 0 });
      headlineText.fillLinearGradientEndPoint({ x: headlineText.width(), y: 0 });
      headlineText.fillLinearGradientColorStops([
        0, '#C9A96E',
        0.5, '#F5E6C8',
        1, '#C9A96E',
      ]);
    }

    // Subtle stroke for contrast
    headlineText.stroke(hl.color);
    headlineText.strokeWidth(0.5);

    textLayer.add(headlineText);
    currentY += headlineText.height() + (hl.marginBottom ?? 12);

    // ── Subheadline ──────────────────────────────────────────────────────

    if (copyData.subheadline && sub) {
      const subText = new Konva.Text({
        x: layout.textBlockX,
        y: currentY,
        text: applyTextTransform(copyData.subheadline, sub.textTransform),
        fontSize: sub.fontSize,
        fontFamily: subFont,
        fontStyle: sub.fontWeight >= 700 ? 'bold' : 'normal',
        fill: sub.color,
        letterSpacing: sub.letterSpacing ?? 0,
        width: layout.textBlockMaxWidth,
        align,
        lineHeight: 1.3,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 6,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        shadowOpacity: 0.3,
      });
      textLayer.add(subText);
      currentY += subText.height() + (sub.marginBottom ?? 10);
    }

    // ── Price ────────────────────────────────────────────────────────────

    let priceHeight = 0;

    if (copyData.priceFormatted) {
      if (price.hasBadge) {
        // Badge label (e.g. "Por apenas")
        if (copyData.priceBadgeText) {
          const badgeLabel = new Konva.Text({
            x: layout.textBlockX,
            y: currentY,
            text: copyData.priceBadgeText,
            fontSize: Math.round(price.fontSize * 0.45),
            fontFamily: subFont,
            fill: price.color,
            opacity: 0.8,
            align,
          });
          textLayer.add(badgeLabel);
          currentY += badgeLabel.height() + 4;
        }

        // Price value with optional badge background
        const priceValue = new Konva.Text({
          text: copyData.priceFormatted,
          fontSize: price.fontSize,
          fontFamily: priceFont,
          fontStyle: 'bold',
          fill: price.color,
        });

        if (price.backgroundColor) {
          const padH = 16;
          const padV = 10;
          const bgW = priceValue.width() + padH * 2;
          const bgH = priceValue.height() + padV * 2;

          const priceBg = new Konva.Rect({
            x: layout.textBlockX,
            y: currentY,
            width: bgW,
            height: bgH,
            fill: price.backgroundColor,
            cornerRadius: price.borderRadius ?? 8,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 8,
            shadowOffsetY: 3,
            shadowOpacity: 0.3,
          });
          textLayer.add(priceBg);

          priceValue.x(layout.textBlockX + padH);
          priceValue.y(currentY + padV);
          textLayer.add(priceValue);
          priceHeight = bgH;
        } else {
          priceValue.x(layout.textBlockX);
          priceValue.y(currentY);
          priceValue.shadowColor('rgba(0,0,0,0.3)');
          priceValue.shadowBlur(6);
          priceValue.shadowOffsetX(1);
          priceValue.shadowOffsetY(2);
          textLayer.add(priceValue);
          priceHeight = priceValue.height();
        }
      } else {
        // Price without badge
        const priceValue = new Konva.Text({
          x: layout.textBlockX,
          y: currentY,
          text: copyData.priceFormatted,
          fontSize: price.fontSize,
          fontFamily: priceFont,
          fontStyle: 'bold',
          fill: price.color,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 6,
          shadowOffsetX: 1,
          shadowOffsetY: 2,
          align,
        });
        textLayer.add(priceValue);
        priceHeight = priceValue.height();
      }
      currentY += priceHeight + (price.marginBottom ?? 16);
    }

    // ── CTA button ───────────────────────────────────────────────────────

    if (copyData.cta) {
      const ctaPadH = 28;
      const ctaPadV = 12;

      // Measure CTA text first
      const ctaTextNode = new Konva.Text({
        text: applyTextTransform(copyData.cta, cta.textTransform),
        fontSize: cta.fontSize,
        fontFamily: ctaFont,
        fontStyle: cta.fontWeight >= 700 ? 'bold' : 'normal',
        fill: cta.color,
        letterSpacing: cta.letterSpacing ?? 1,
      });

      const ctaBtnW = ctaTextNode.width() + ctaPadH * 2;
      const ctaBtnH = ctaTextNode.height() + ctaPadV * 2;

      // Button background
      const ctaBtn = new Konva.Rect({
        x: layout.textBlockX,
        y: currentY,
        width: ctaBtnW,
        height: ctaBtnH,
        fill: cta.backgroundColor || '#ff713d',
        cornerRadius: cta.borderRadius ?? 8,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowBlur: 14,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        shadowOpacity: 0.4,
      });
      textLayer.add(ctaBtn);

      // CTA text centered inside button
      ctaTextNode.x(layout.textBlockX + ctaPadH);
      ctaTextNode.y(currentY + ctaPadV);
      textLayer.add(ctaTextNode);
    }

    // ── Export ────────────────────────────────────────────────────────────

    bgLayer.draw();
    textLayer.draw();

    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    console.log('[KonvaRenderer] Export complete —', dataURL.length, 'chars');

    return dataURL;
  } finally {
    stage.destroy();
    document.body.removeChild(container);
  }
}
