// src/features/engine/mock-image.ts
import type { CompiledPrompt } from "./prompt-compiler";

// gera imagens “boas” de placeholder sem depender de IA
export function buildMockImageUrl(
  meta: CompiledPrompt["meta"],
  seed: string
) {
  const w = meta.size.w;
  const h = meta.size.h;

  // picsum funciona bem; seed garante variação consistente
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}