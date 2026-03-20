// src/services/typographyRenderer.ts
// CREATYNG — Renderiza overlay de texto profissional usando HTML/CSS + html2canvas.
// Substitui o Canvas 2D manual por templates tipográficos completos.

import html2canvas from 'html2canvas';
import { type TypographyTemplate, selectTemplate, TYPOGRAPHY_TEMPLATES } from './typographyTemplates';

interface TextData {
  headline?: string;
  price?: string;
  cta?: string;
  contact?: string;
}

/**
 * Adapta o template baseado na análise da referência (textPlacement).
 * Ajusta posição, cor e overlay pra maximizar legibilidade.
 */
function adaptTemplate(
  template: TypographyTemplate,
  analysis: Record<string, unknown> | null | undefined,
): TypographyTemplate {
  const adapted = JSON.parse(JSON.stringify(template)) as TypographyTemplate;
  const tp = (analysis as any)?.textPlacement;

  if (!tp) return adapted;

  // Adaptar posição baseado na análise
  if (tp.primaryArea) {
    const areaMap: Record<string, TypographyTemplate['container']['position']> = {
      'bottom-center': 'bottom',
      'bottom-left': 'bottom-left',
      'bottom-right': 'bottom-right',
      'top-center': 'top',
      'center': 'center',
    };
    if (areaMap[tp.primaryArea]) {
      adapted.container.position = areaMap[tp.primaryArea];
    }
  }

  // Adaptar cor do texto baseado no fundo
  if (tp.suggestedTextColor) {
    adapted.headline.color = tp.suggestedTextColor;
    adapted.price.color = tp.suggestedTextColor;
  }

  // Se fundo na área de texto é claro, usar texto escuro
  if (tp.backgroundDarknessInTextArea === 'light') {
    adapted.headline.color = '#141417';
    adapted.price.color = '#141417';
    adapted.cta.color = '#141417';
    adapted.contact.color = '#141417';
    if (adapted.decorations) {
      adapted.decorations.overlayGradient = undefined;
    }
    adapted.container.background = 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 100%)';
    adapted.headline.textShadow = '0 1px 8px rgba(255,255,255,0.3)';
  }

  // Se fundo na área de texto é escuro, reforçar overlay
  if (tp.backgroundDarknessInTextArea === 'dark') {
    adapted.container.background = 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)';
  }

  return adapted;
}

/**
 * Renderiza overlay de texto sobre uma imagem base usando HTML/CSS.
 * Retorna base64 da imagem final com texto.
 */
export async function renderTypographyOverlay(
  baseImage: string,
  texts: TextData,
  analysis?: Record<string, unknown> | null,
  templateId?: string,
  width: number = 1080,
  height: number = 1080,
): Promise<string> {

  let template = templateId
    ? TYPOGRAPHY_TEMPLATES.find(t => t.id === templateId) || selectTemplate(analysis)
    : selectTemplate(analysis);

  // Adaptar baseado na análise de textPlacement
  template = adaptTemplate(template, analysis);

  console.log('[Typography] Using template:', template.id, template.name);

  // Criar container HTML temporário (offscreen)
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: 'Instrument Sans', 'Inter', 'Helvetica Neue', Arial, sans-serif;
  `;
  document.body.appendChild(container);

  container.innerHTML = buildOverlayHTML(baseImage, texts, template, width, height);

  // Aguardar imagens carregarem
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(img =>
      img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
    )
  );

  // Aguardar fonts carregarem
  await document.fonts.ready;

  // Pequeno delay pra garantir render
  await new Promise(res => setTimeout(res, 100));

  try {
    const canvas = await html2canvas(container, {
      width,
      height,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  } finally {
    document.body.removeChild(container);
  }
}

// ── Composition AI mode ─────────────────────────────────────────────────────

interface CopyData {
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

interface CompositionData {
  layout: CompositionLayout;
  headline: CompositionTextStyle;
  subheadline?: CompositionTextStyle;
  price: CompositionPriceStyle;
  cta: CompositionCtaStyle;
  backdrop?: CompositionBackdrop;
  colorPalette?: Record<string, string>;
}

/**
 * Renderiza overlay usando instruções de composição da IA (posições, cores, fontes exatas).
 * Modo alternativo ao template-based — ativado quando compositionData está disponível.
 */
export async function renderCompositionOverlay(
  baseImage: string,
  copyData: CopyData,
  compositionData: CompositionData,
  width: number = 1080,
  height: number = 1080,
): Promise<string> {
  const layout = compositionData.layout;
  const hl = compositionData.headline;
  const sub = compositionData.subheadline;
  const price = compositionData.price;
  const cta = compositionData.cta;
  const backdrop = compositionData.backdrop;

  console.log('[Typography:CompositionAI] Rendering with AI layout at', layout.textBlockX, layout.textBlockY);

  // Load Google Font if specified
  const fonts = new Set<string>();
  [hl.fontFamily, sub?.fontFamily, price.fontFamily, cta.fontFamily].forEach(f => {
    if (f && !f.includes('sans-serif') && !f.includes('serif')) {
      const fontName = f.split(',')[0].trim().replace(/['"]/g, '');
      if (fontName) fonts.add(fontName);
    }
  });

  // Inject Google Fonts CSS link
  const fontLinks = Array.from(fonts).map(f => {
    const encoded = encodeURIComponent(f);
    return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;
  }).join('\n');

  // Build headline HTML
  const headlineHTML = copyData.headline
    ? `<div style="
        font-family:${hl.fontFamily || 'Inter, sans-serif'};
        font-size:${hl.fontSize}px;
        font-weight:${hl.fontWeight};
        color:${hl.color};
        letter-spacing:${hl.letterSpacing ?? 0}px;
        text-transform:${hl.textTransform || 'none'};
        ${hl.textShadow ? `text-shadow:${hl.textShadow};` : ''}
        margin-bottom:${hl.marginBottom ?? 8}px;
        line-height:1.15;
        word-wrap:break-word;
      ">${copyData.headline}</div>`
    : '';

  // Build subheadline HTML
  const subheadlineHTML = copyData.subheadline && sub
    ? `<div style="
        font-family:${sub.fontFamily || 'Inter, sans-serif'};
        font-size:${sub.fontSize}px;
        font-weight:${sub.fontWeight};
        color:${sub.color};
        letter-spacing:${sub.letterSpacing ?? 0}px;
        text-transform:${sub.textTransform || 'none'};
        margin-bottom:${sub.marginBottom ?? 8}px;
        line-height:1.3;
      ">${copyData.subheadline}</div>`
    : '';

  // Build price HTML
  let priceHTML = '';
  if (copyData.priceFormatted) {
    const badgeText = copyData.priceBadgeText
      ? `<span style="font-size:${Math.round(price.fontSize * 0.6)}px; font-weight:400; opacity:0.8; display:block; margin-bottom:4px;">${copyData.priceBadgeText}</span>`
      : '';

    if (price.hasBadge && price.backgroundColor) {
      priceHTML = `<div style="
        display:inline-block;
        background:${price.backgroundColor};
        border-radius:${price.borderRadius ?? 8}px;
        padding:${price.padding || '8px 20px'};
        margin-bottom:${price.marginBottom ?? 12}px;
      ">
        ${badgeText}
        <span style="
          font-size:${price.fontSize}px;
          font-weight:${price.fontWeight};
          color:${price.color};
        ">${copyData.priceFormatted}</span>
      </div>`;
    } else {
      priceHTML = `<div style="
        margin-bottom:${price.marginBottom ?? 12}px;
      ">
        ${badgeText}
        <span style="
          font-size:${price.fontSize}px;
          font-weight:${price.fontWeight};
          color:${price.color};
        ">${copyData.priceFormatted}</span>
      </div>`;
    }
  }

  // Build CTA HTML
  const ctaHTML = copyData.cta
    ? `<div style="
        display:inline-block;
        background:${cta.backgroundColor || '#ff713d'};
        border-radius:${cta.borderRadius ?? 8}px;
        padding:${cta.padding || '12px 32px'};
      ">
        <span style="
          font-size:${cta.fontSize}px;
          font-weight:${cta.fontWeight};
          color:${cta.color};
          letter-spacing:${cta.letterSpacing ?? 1}px;
          text-transform:${cta.textTransform || 'uppercase'};
        ">${copyData.cta}</span>
      </div>`
    : '';

  // Build backdrop HTML
  const backdropHTML = backdrop?.enabled
    ? `<div style="position:absolute; inset:0; ${backdrop.css ? `background:${backdrop.css};` : ''}"></div>`
    : '';

  const html = `
    ${fontLinks}
    <div style="position:relative; width:${width}px; height:${height}px; overflow:hidden;">
      <img src="${baseImage}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" crossorigin="anonymous" />
      ${backdropHTML}
      <div style="
        position:absolute;
        left:${layout.textBlockX}px;
        top:${layout.textBlockY}px;
        max-width:${layout.textBlockMaxWidth}px;
        text-align:${layout.textAlign || 'left'};
        z-index:10;
      ">
        ${headlineHTML}
        ${subheadlineHTML}
        ${priceHTML}
        ${ctaHTML}
      </div>
    </div>
  `;

  // Render using html2canvas (same approach as template mode)
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
  `;
  document.body.appendChild(container);
  container.innerHTML = html;

  // Wait for images to load
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(img =>
      img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
    )
  );

  // Wait for fonts
  await document.fonts.ready;
  await new Promise(res => setTimeout(res, 150));

  try {
    const canvas = await html2canvas(container, {
      width,
      height,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  } finally {
    document.body.removeChild(container);
  }
}

function buildOverlayHTML(
  baseImage: string,
  texts: TextData,
  template: TypographyTemplate,
  width: number,
  height: number,
): string {
  const t = template;
  const h = texts.headline || '';
  const p = texts.price || '';
  const c = texts.cta || '';
  const ct = texts.contact || '';

  // Container position
  let containerPosition = '';
  switch (t.container.position) {
    case 'bottom':
      containerPosition = 'position:absolute; bottom:0; left:0; right:0;';
      break;
    case 'top':
      containerPosition = 'position:absolute; top:0; left:0; right:0;';
      break;
    case 'center':
      containerPosition = 'position:absolute; top:50%; left:0; right:0; transform:translateY(-50%);';
      break;
    case 'bottom-left':
      containerPosition = 'position:absolute; bottom:0; left:0; width:65%;';
      break;
    case 'bottom-right':
      containerPosition = 'position:absolute; bottom:0; right:0; width:65%; text-align:right;';
      break;
    case 'split-bottom':
      containerPosition = 'position:absolute; bottom:0; left:0; right:0;';
      break;
  }

  const overlayGradient = t.decorations?.overlayGradient || t.container.background || '';

  // Contact HTML
  let contactHTML = '';
  if (ct && t.contact.show) {
    const contactPos = t.contact.position === 'bottom-right'
      ? 'position:absolute; bottom:16px; right:20px;'
      : t.contact.position === 'bottom-left'
      ? 'position:absolute; bottom:16px; left:20px;'
      : t.contact.position === 'top-right'
      ? 'position:absolute; top:16px; right:20px;'
      : 'margin-top:12px;';

    contactHTML = `<div style="${t.contact.position !== 'below-cta' ? contactPos : 'margin-top:12px;'} font-size:${t.contact.fontSize}; font-weight:${t.contact.fontWeight}; color:${t.contact.color}; opacity:${t.contact.opacity};">${ct}</div>`;
  }

  // Price HTML
  let priceHTML = '';
  if (p && t.price.show) {
    if (t.price.badge.enabled) {
      priceHTML = `<div style="display:inline-block; background:${t.price.badge.background}; border-radius:${t.price.badge.borderRadius}; padding:${t.price.badge.padding}; ${t.price.badge.border ? `border:${t.price.badge.border};` : ''} ${t.price.badge.backdropFilter ? `backdrop-filter:${t.price.badge.backdropFilter};` : ''} margin-top:16px;">
        <span style="font-size:${t.price.fontSize}; font-weight:${t.price.fontWeight}; color:${t.price.color};">${p}</span>
      </div>`;
    } else {
      priceHTML = `<div style="margin-top:14px; font-size:${t.price.fontSize}; font-weight:${t.price.fontWeight}; color:${t.price.color};">${p}</div>`;
    }
  }

  // CTA HTML
  let ctaHTML = '';
  if (c && t.cta.show) {
    if (t.cta.button?.enabled) {
      ctaHTML = `<div style="margin-top:16px; display:inline-block; background:${t.cta.button.background}; border-radius:${t.cta.button.borderRadius}; padding:${t.cta.button.padding}; ${t.cta.button.border ? `border:${t.cta.button.border};` : ''}">
        <span style="font-size:${t.cta.fontSize}; font-weight:${t.cta.fontWeight}; color:${t.cta.color}; letter-spacing:${t.cta.letterSpacing}; text-transform:${t.cta.textTransform};">${c}</span>
      </div>`;
    } else {
      ctaHTML = `<div style="margin-top:14px; font-size:${t.cta.fontSize}; font-weight:${t.cta.fontWeight}; color:${t.cta.color}; letter-spacing:${t.cta.letterSpacing}; text-transform:${t.cta.textTransform}; opacity:${t.cta.opacity};">${c}</div>`;
    }
  }

  // Divider decoration
  let dividerHTML = '';
  if (t.decorations?.dividerLine) {
    const d = t.decorations.dividerLine;
    dividerHTML = `<div style="width:${d.width}; height:1.5px; background:${d.color}; opacity:${d.opacity}; margin:16px ${t.headline.textAlign === 'center' ? 'auto' : '0'};"></div>`;
  }

  // Accent dot
  let dotHTML = '';
  if (t.decorations?.accentDot) {
    const d = t.decorations.accentDot;
    dotHTML = `<div style="width:${d.size}; height:${d.size}; border-radius:50%; background:${d.color}; margin:12px ${t.headline.textAlign === 'center' ? 'auto' : '0'};"></div>`;
  }

  return `
    <div style="position:relative; width:${width}px; height:${height}px; overflow:hidden;">
      <!-- Base image -->
      <img src="${baseImage}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" crossorigin="anonymous" />

      <!-- Overlay gradient -->
      ${overlayGradient ? `<div style="position:absolute; inset:0; background:${overlayGradient};"></div>` : ''}

      <!-- Text container -->
      <div style="${containerPosition} padding:${t.container.padding}; z-index:10;">

        <!-- Headline -->
        ${h ? `<div style="
          font-family:${t.headline.fontFamily};
          font-size:${t.headline.fontSize};
          font-weight:${t.headline.fontWeight};
          color:${t.headline.color};
          letter-spacing:${t.headline.letterSpacing};
          line-height:${t.headline.lineHeight};
          text-transform:${t.headline.textTransform};
          text-shadow:${t.headline.textShadow};
          max-width:${t.headline.maxWidth};
          text-align:${t.headline.textAlign};
          ${t.headline.textAlign === 'center' ? 'margin:0 auto;' : ''}
          ${t.headline.WebkitTextStroke ? `-webkit-text-stroke:${t.headline.WebkitTextStroke};` : ''}
          word-wrap:break-word;
        ">${h}</div>` : ''}

        ${dividerHTML}
        ${dotHTML}

        <!-- Price -->
        <div style="text-align:${t.headline.textAlign};">
          ${priceHTML}
        </div>

        <!-- CTA -->
        <div style="text-align:${t.headline.textAlign};">
          ${ctaHTML}
        </div>

        <!-- Contact (below CTA) -->
        <div style="text-align:${t.headline.textAlign};">
          ${t.contact.position === 'below-cta' ? contactHTML : ''}
        </div>
      </div>

      <!-- Contact (absolute positioned) -->
      ${t.contact.position !== 'below-cta' ? contactHTML : ''}
    </div>
  `;
}
