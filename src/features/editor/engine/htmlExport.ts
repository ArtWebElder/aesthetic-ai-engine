// CREATYNG — HTML Composition → PNG export via html2canvas.
// Injects premium Google Fonts and waits for them before rasterizing.
import html2canvas from 'html2canvas';
import type { CreatygnComposition } from '@/types/composition';
import { renderCompositionToHTML } from './htmlRenderer';
import { PREMIUM_FONTS_URL } from '@/data/typographyPresets';

/** Ensure premium Google Fonts are loaded (idempotent) */
function ensurePremiumFonts(): void {
  const id = 'creatyng-premium-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = PREMIUM_FONTS_URL;
  document.head.appendChild(link);
}

export async function exportCompositionToPNG(
  composition: CreatygnComposition,
  scale: number = 2  // 2x = 2160x2160 → 2K quality
): Promise<string> {
  // 0. Inject Google Fonts
  ensurePremiumFonts();

  // 1. Render DOM
  const container = renderCompositionToHTML(composition);

  // 2. Mount off-screen
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '-99999px';
  document.body.appendChild(container);

  // 3. Wait for fonts and images
  await document.fonts.ready;

  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
    )
  );

  // Small delay for rendering to settle
  await new Promise(resolve => setTimeout(resolve, 150));

  // 4. Rasterize
  const canvas = await html2canvas(container, {
    width: composition.canvasSize.width,
    height: composition.canvasSize.height,
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
  });

  // 5. Cleanup
  document.body.removeChild(container);

  // 6. Return base64
  return canvas.toDataURL('image/png', 0.95);
}
