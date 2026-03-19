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
