// LEGACY — Stage 3 suspenso. Verificar dependências antes de remover.
// Mantido porque htmlExport.ts (usado pelo WizardPage.tsx) depende deste arquivo.
import type {
  CreatygnComposition,
  CompositionLayer,
  LayerPosition,
  BackgroundLayer,
  GradientOverlayLayer,
  ImageLayer,
  DecorativeTextLayer,
  HeadlineLayer,
  SubheadlineLayer,
  BadgeLayer,
  ContactBarLayer,
  TextStyle,
  BadgeElement,
} from '@/types/composition';

// ============================================================
// RENDERER HTML/CSS
// Converte CreatygnComposition JSON em DOM elements estilizados
// ============================================================

export function renderCompositionToHTML(
  composition: CreatygnComposition
): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'creatyng-composition';
  container.style.cssText = `
    position: relative;
    width: ${composition.canvasSize.width}px;
    height: ${composition.canvasSize.height}px;
    overflow: hidden;
    font-family: Montserrat, sans-serif;
    background: #000;
  `;

  // Renderizar layers em ordem de zIndex
  const sortedLayers = [...composition.layers].sort((a, b) => {
    const zA = ('zIndex' in a ? a.zIndex : 0) as number;
    const zB = ('zIndex' in b ? b.zIndex : 0) as number;
    return zA - zB;
  });

  for (const layer of sortedLayers) {
    const el = renderLayer(layer);
    if (el) container.appendChild(el);
  }

  return container;
}

function renderLayer(layer: CompositionLayer): HTMLElement | null {
  switch (layer.type) {
    case 'background': return renderBackground(layer);
    case 'gradient-overlay': return renderGradientOverlay(layer);
    case 'image': return renderImage(layer);
    case 'decorative-text': return renderDecorativeText(layer);
    case 'headline': return renderHeadline(layer);
    case 'subheadline': return renderSubheadline(layer);
    case 'badge': return renderBadge(layer);
    case 'contact-bar': return renderContactBar(layer);
    default: return null;
  }
}

// ---- Background ----

function renderBackground(layer: BackgroundLayer): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `position: absolute; inset: 0; z-index: 0;`;

  if (layer.source.type === 'image') {
    el.style.backgroundImage = `url(${layer.source.base64})`;
    el.style.backgroundSize = layer.source.fit;
    el.style.backgroundPosition = 'center';
  } else if (layer.source.type === 'gradient') {
    el.style.background = layer.source.css;
  } else if (layer.source.type === 'solid') {
    el.style.background = layer.source.color;
  }

  return el;
}

// ---- Gradient Overlay ----

function renderGradientOverlay(layer: GradientOverlayLayer): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute; inset: 0;
    background: ${layer.css};
    z-index: ${layer.zIndex};
    pointer-events: none;
  `;
  return el;
}

// ---- Image (subject, etc) ----

function renderImage(layer: ImageLayer): HTMLElement {
  const wrapper = document.createElement('div');
  const pos = resolvePosition(layer.position);
  wrapper.style.cssText = `
    position: absolute;
    ${pos}
    width: ${layer.size.width};
    height: ${layer.size.height};
    ${layer.size.maxWidth ? `max-width: ${layer.size.maxWidth};` : ''}
    ${layer.size.maxHeight ? `max-height: ${layer.size.maxHeight};` : ''}
    z-index: ${layer.zIndex};
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const img = document.createElement('img');
  img.src = layer.base64;
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: ${layer.size.objectFit};
    ${layer.effects?.dropShadow ? `filter: drop-shadow(${layer.effects.dropShadow});` : ''}
    ${layer.effects?.opacity !== undefined ? `opacity: ${layer.effects.opacity};` : ''}
    ${layer.effects?.borderRadius ? `border-radius: ${layer.effects.borderRadius};` : ''}
    ${layer.effects?.mixBlendMode ? `mix-blend-mode: ${layer.effects.mixBlendMode};` : ''}
  `;

  wrapper.appendChild(img);
  return wrapper;
}

// ---- Decorative Text ----

function renderDecorativeText(layer: DecorativeTextLayer): HTMLElement {
  const wrapper = document.createElement('div');
  const pos = resolvePosition(layer.position);
  wrapper.style.cssText = `
    position: absolute;
    ${pos}
    z-index: ${layer.zIndex};
    pointer-events: none;
    white-space: nowrap;
  `;

  // Texto principal
  const main = document.createElement('div');
  main.textContent = layer.text;
  main.style.cssText = textStyleToCSS(layer.style);
  wrapper.appendChild(main);

  // Repetições
  if (layer.repeat) {
    for (let i = 1; i <= layer.repeat.count; i++) {
      const rep = document.createElement('div');
      rep.textContent = layer.text;
      const repStyle = { ...layer.style };
      repStyle.opacity = (repStyle.opacity || 0.18) * Math.pow(layer.repeat.opacityDecay, i);
      rep.style.cssText = textStyleToCSS(repStyle);
      rep.style.marginTop = layer.repeat.offsetY;
      wrapper.appendChild(rep);
    }
  }

  return wrapper;
}

// ---- Headline ----

function renderHeadline(layer: HeadlineLayer): HTMLElement {
  const wrapper = document.createElement('div');
  const pos = resolvePosition(layer.position);
  wrapper.style.cssText = `
    position: absolute;
    ${pos}
    z-index: ${layer.zIndex};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${layer.gap};
    width: 90%;
  `;

  for (const seg of layer.segments) {
    const el = document.createElement('div');
    el.textContent = seg.text;
    el.style.cssText = textStyleToCSS(seg.style);
    el.style.width = '100%';
    wrapper.appendChild(el);
  }

  return wrapper;
}

// ---- Subheadline ----

function renderSubheadline(layer: SubheadlineLayer): HTMLElement {
  const el = document.createElement('div');
  const pos = resolvePosition(layer.position);
  el.textContent = layer.text;
  el.style.cssText = `
    position: absolute;
    ${pos}
    z-index: ${layer.zIndex};
    width: 80%;
    ${textStyleToCSS(layer.style)}
  `;
  return el;
}

// ---- Badge ----

function renderBadge(layer: BadgeLayer): HTMLElement {
  const wrapper = document.createElement('div');
  const pos = resolvePosition(layer.position);
  wrapper.style.cssText = `
    position: absolute;
    ${pos}
    width: ${layer.size.width};
    z-index: ${layer.zIndex};
    background: ${layer.background.gradient || layer.background.color};
    border-radius: ${layer.background.borderRadius};
    ${layer.background.border ? `border: ${layer.background.border};` : ''}
    ${layer.background.boxShadow ? `box-shadow: ${layer.background.boxShadow};` : ''}
    ${layer.background.backdropFilter ? `backdrop-filter: ${layer.background.backdropFilter};` : ''}
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    gap: 12px;
  `;

  for (const element of layer.elements) {
    const el = renderBadgeElement(element);
    if (el) wrapper.appendChild(el);
  }

  return wrapper;
}

function renderBadgeElement(element: BadgeElement): HTMLElement | null {
  switch (element.type) {
    case 'suffix': {
      const el = document.createElement('div');
      el.textContent = element.text;
      el.style.cssText = textStyleToCSS(element.style);
      return el;
    }
    case 'price': {
      const el = document.createElement('div');
      el.textContent = element.text;
      el.style.cssText = textStyleToCSS(element.style);
      return el;
    }
    case 'divider': {
      const el = document.createElement('div');
      el.style.cssText = `
        width: ${element.style.width};
        height: ${element.style.height};
        background: ${element.style.color};
        align-self: stretch;
      `;
      return el;
    }
    case 'cta': {
      const el = document.createElement('div');
      el.textContent = element.text;
      el.style.cssText = `
        ${textStyleToCSS(element.style)}
        background: ${element.background.color};
        border-radius: ${element.background.borderRadius};
        padding: 8px 20px;
      `;
      return el;
    }
    default:
      return null;
  }
}

// ---- Contact Bar ----

function renderContactBar(layer: ContactBarLayer): HTMLElement {
  const wrapper = document.createElement('div');
  const pos = resolvePosition(layer.position);
  wrapper.style.cssText = `
    position: absolute;
    ${pos}
    z-index: ${layer.zIndex};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    ${layer.background ? `
      background: ${layer.background.color};
      border-radius: ${layer.background.borderRadius};
      ${layer.background.border ? `border: ${layer.background.border};` : ''}
      padding: 8px 24px;
    ` : ''}
  `;

  layer.items.forEach((item, i) => {
    // Icon
    if (item.icon) {
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: ${item.icon.size};
        height: ${item.icon.size};
        border-radius: 50%;
        background: ${item.icon.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(${item.icon.size} * 0.45);
        color: white;
        font-weight: bold;
      `;
      icon.textContent = item.type === 'whatsapp' ? 'W' : '@';
      wrapper.appendChild(icon);
    }

    // Text
    const text = document.createElement('span');
    text.textContent = item.value;
    text.style.cssText = textStyleToCSS(layer.style);
    wrapper.appendChild(text);

    // Separator
    if (i < layer.items.length - 1 && layer.separator) {
      const sep = document.createElement('span');
      sep.textContent = layer.separator.text;
      sep.style.cssText = textStyleToCSS(layer.separator.style);
      wrapper.appendChild(sep);
    }
  });

  return wrapper;
}

// ---- Helpers ----

function resolvePosition(pos: LayerPosition): string {
  let css = '';

  // Horizontal
  if (pos.x === '50%' || pos.anchor === 'center' || pos.anchor === 'top-center' || pos.anchor === 'bottom-center') {
    css += `left: 50%; transform: translateX(-50%);`;
  } else if (pos.x.endsWith('%') || pos.x.endsWith('px')) {
    css += `left: ${pos.x};`;
  } else {
    css += `left: ${pos.x};`;
  }

  // Vertical
  if (pos.y !== 'auto') {
    css += `top: ${pos.y};`;
  }

  return css;
}

function textStyleToCSS(style: TextStyle): string {
  let css = `
    font-family: ${style.fontFamily}, sans-serif;
    font-weight: ${style.fontWeight};
    font-size: ${style.fontSize};
    font-style: ${style.fontStyle};
    color: ${style.color};
    text-transform: ${style.textTransform};
    letter-spacing: ${style.letterSpacing};
    line-height: ${style.lineHeight};
    text-align: ${style.textAlign};
  `;

  if (style.textShadow && style.textShadow !== 'none') {
    css += `text-shadow: ${style.textShadow};`;
  }
  if (style.webkitTextStroke) {
    css += `-webkit-text-stroke: ${style.webkitTextStroke};`;
  }
  if (style.opacity !== undefined) {
    css += `opacity: ${style.opacity};`;
  }
  if (style.filter) {
    css += `filter: ${style.filter};`;
  }
  if (style.mixBlendMode) {
    css += `mix-blend-mode: ${style.mixBlendMode};`;
  }
  if (style.transform) {
    css += `transform: ${style.transform};`;
  }

  // BACKGROUND-CLIP: TEXT — gradient text support
  // html2canvas has limited support for background-clip:text, so we use
  // an SVG fallback approach when the composition is exported.
  // For live preview (DOM), we apply the CSS directly.
  if (style.backgroundClip === 'text' && style.backgroundImage) {
    css += `
      background-image: ${style.backgroundImage};
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    `;
  }

  return css;
}
