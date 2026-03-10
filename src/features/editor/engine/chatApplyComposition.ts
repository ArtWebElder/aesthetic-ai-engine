import type {
  CreatygnComposition,
  HeadlineLayer,
  BadgeLayer,
} from '@/types/composition';
import type { ChatCommand } from './chatParser';
import { segmentHeadline } from './textRenderer';

export function applyChatToComposition(
  composition: CreatygnComposition,
  command: ChatCommand
): CreatygnComposition {
  const updated = structuredClone(composition);

  switch (command.type) {
    case 'change_text': {
      if (command.target === 'headline') {
        const layer = updated.layers.find(l => l.type === 'headline') as HeadlineLayer | undefined;
        if (layer && command.value) {
          const newSegments = segmentHeadline(command.value);
          layer.segments = newSegments.map((seg, i) => ({
            text: seg.text,
            role: seg.isAccent ? 'impact' as const : 'context' as const,
            style: layer.segments[i]?.style || layer.segments[0].style,
          }));
        }
        // Também atualizar texto decorativo
        const decoLayer = updated.layers.find(l => l.type === 'decorative-text');
        if (decoLayer && decoLayer.type === 'decorative-text') {
          const words = (command.value || '').toUpperCase().split(/\s+/);
          decoLayer.text = words.find(w => w.length >= 3) || words[0] || '';
        }
      }
      if (command.target === 'subheadline') {
        const layer = updated.layers.find(l => l.type === 'subheadline');
        if (layer && layer.type === 'subheadline') {
          layer.text = command.value || '';
        }
      }
      if (command.target === 'cta') {
        const badge = updated.layers.find(l => l.type === 'badge') as BadgeLayer | undefined;
        if (badge) {
          const ctaEl = badge.elements.find(e => e.type === 'cta');
          if (ctaEl && ctaEl.type === 'cta') ctaEl.text = (command.value || '').toUpperCase();
        }
      }
      if (command.target === 'price') {
        const badge = updated.layers.find(l => l.type === 'badge') as BadgeLayer | undefined;
        if (badge) {
          const priceEl = badge.elements.find(e => e.type === 'price');
          if (priceEl && priceEl.type === 'price') priceEl.text = `R$ ${command.value}`;
        }
      }
      break;
    }

    case 'change_color': {
      const newColor = command.value!;
      for (const layer of updated.layers) {
        if (layer.type === 'headline') {
          for (const seg of layer.segments) {
            if (seg.role === 'impact' && seg.style.color !== '#FFFFFF' && seg.style.color !== 'rgba(255,255,255,0.88)') {
              seg.style.color = newColor;
            }
          }
        }
        if (layer.type === 'decorative-text') {
          layer.style.color = newColor;
        }
        if (layer.type === 'badge') {
          for (const el of layer.elements) {
            if (el.type === 'price') el.style.color = newColor;
            if (el.type === 'cta') el.background.color = newColor;
          }
          layer.background.border = `1.5px solid ${newColor}25`;
        }
      }
      break;
    }

    case 'change_font': {
      const newFont = command.value!;
      for (const layer of updated.layers) {
        if (layer.type === 'headline') {
          for (const seg of layer.segments) seg.style.fontFamily = newFont;
        }
        if (layer.type === 'subheadline') layer.style.fontFamily = newFont;
        if (layer.type === 'decorative-text') layer.style.fontFamily = newFont;
        if (layer.type === 'badge') {
          for (const el of layer.elements) {
            if ('style' in el) (el as { style: { fontFamily: string } }).style.fontFamily = newFont;
          }
        }
        if (layer.type === 'contact-bar') layer.style.fontFamily = newFont;
      }
      break;
    }

    case 'change_size': {
      const factor = command.value === 'up' ? 1.15 : 0.85;
      const layer = updated.layers.find(l => l.type === 'headline') as HeadlineLayer | undefined;
      if (layer) {
        for (const seg of layer.segments) {
          const match = seg.style.fontSize.match(/([\d.]+)(.*)/);
          if (match) {
            const newSize = parseFloat(match[1]) * factor;
            seg.style.fontSize = `${newSize.toFixed(1)}${match[2]}`;
          }
        }
      }
      break;
    }
  }

  return updated;
}
