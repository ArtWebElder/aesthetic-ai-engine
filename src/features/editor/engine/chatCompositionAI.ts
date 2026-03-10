// src/features/editor/engine/chatCompositionAI.ts
// CREATYNG — Aplica comandos de chat ao JSON de composição via Gemini Flash.
// Tenta o path de IA primeiro; fallback automático para parseChat() + applyChatToComposition().

import type { CreatygnComposition } from '@/types/composition';
import { parseChat } from './chatParser';
import { applyChatToComposition } from './chatApplyComposition';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

/**
 * Aplica um comando de texto livre ao JSON de composição.
 * 1. Tenta via Edge Function chat-edit (Gemini Flash) — mais expressivo.
 * 2. Fallback: regex local (parseChat + applyChatToComposition) — zero latência.
 *
 * Retorna a composição modificada. Nunca lança exceção — em erro retorna original.
 */
export async function applyCommandWithAI(
  composition: CreatygnComposition,
  commandText: string,
): Promise<{ composition: CreatygnComposition; usedAI: boolean; description: string }> {
  const trimmed = commandText.trim();
  if (!trimmed) return { composition, usedAI: false, description: "Comando vazio." };

  // ── Path 1: Gemini Flash via Edge Function ─────────────────────────────────
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-edit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ composition, command: trimmed }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.composition) {
          return {
            composition: data.composition as CreatygnComposition,
            usedAI: true,
            description: "✅ Aplicado via IA",
          };
        }
      } else {
        console.warn("[chatCompositionAI] Edge Function returned", res.status, "— fallback to regex");
      }
    } catch (e) {
      console.warn("[chatCompositionAI] AI path error, fallback to regex:", e);
    }
  }

  // ── Path 2: Fallback regex ──────────────────────────────────────────────────
  const command = parseChat(trimmed);
  if (command.type === "unknown" || command.type === "regenerate_image") {
    return {
      composition,
      usedAI: false,
      description: command.description,
    };
  }
  const updated = applyChatToComposition(composition, command);
  return {
    composition: updated,
    usedAI: false,
    description: `✅ ${command.description}`,
  };
}
