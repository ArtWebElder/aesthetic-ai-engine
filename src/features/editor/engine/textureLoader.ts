// src/features/editor/engine/textureLoader.ts
// CREATYNG — MASTER SPEC DIFF TR.1
// Carrega e cacheia texturas para o renderer de texto.

const TEXTURE_PATHS: Record<string, string> = {
  grunge_metal: "/textures/grunge-metal.png",
  spray_paint: "/textures/spray-paint.png",
  noise_subtle: "/textures/noise-subtle.png",
};

const cache = new Map<string, HTMLImageElement>();

/** Carrega uma textura pelo nome. Segunda chamada retorna do cache sem rede. */
export async function loadTexture(name: string): Promise<HTMLImageElement> {
  if (cache.has(name)) return cache.get(name)!;

  const path = TEXTURE_PATHS[name];
  if (!path) throw new Error(`Texture not found: ${name}`);

  const img = new Image();
  img.src = path;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load texture: ${path}`));
  });

  cache.set(name, img);
  return img;
}

/** Pré-carrega todas as texturas em background. Chamar na inicialização. */
export function preloadTextures(): void {
  Object.keys(TEXTURE_PATHS).forEach((name) => {
    loadTexture(name).catch(() => {
      // Silencioso — textura carregará na próxima tentativa
    });
  });
}

export { TEXTURE_PATHS };
