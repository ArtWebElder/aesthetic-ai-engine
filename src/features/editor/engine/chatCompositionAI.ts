// src/features/editor/engine/chatCompositionAI.ts
// CREATYNG — Aplica comandos de chat ao JSON de composição via Gemini Flash.
// Fluxo: 1. Regex (instantâneo) → 2. Gemini Flash direto (se regex=unknown) → 3. "Não entendi"

import type { CreatygnComposition } from '@/types/composition';
import { parseChat } from './chatParser';
import { applyChatToComposition } from './chatApplyComposition';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) ?? "";
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

console.log('[ChatAI] attempting AI path...');
console.log('[ChatAI] supabase URL:', SUPABASE_URL || '(não configurado)');
console.log('[ChatAI] Gemini API key present:', !!GEMINI_API_KEY);

/**
 * Chama Gemini Flash diretamente do browser para interpretar o comando.
 * Usa cascading model fallback. Retorna a composição modificada ou null em caso de falha.
 */
async function applyViaGeminiFrontend(
  composition: CreatygnComposition,
  command: string,
): Promise<CreatygnComposition | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[ChatAI] VITE_GEMINI_API_KEY não configurado — pulando path IA');
    return null;
  }

  const prompt = `Você é o motor de design do Creatyng. Recebe um JSON de composição e um comando do usuário. Retorne APENAS o JSON modificado, sem markdown, sem explicação, sem backticks.

JSON atual: ${JSON.stringify(composition)}

Comando do usuário: "${command}"

Regras:
- Modifique APENAS o que o usuário pediu
- Mantenha toda a estrutura do JSON intacta
- Se o comando pede mudar texto, mude apenas o text do layer
- Se pede mudar cor, mude o color nos styles relevantes
- Se pede mudar fonte, mude fontFamily em todos os layers
- Se pede mudar tamanho, ajuste fontSize proporcionalmente
- Retorne o JSON completo modificado`;

  const bodyStr = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
  });

  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      console.log(`[ChatAI] Trying model: ${model}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        console.warn(`[ChatAI] ${model} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!raw) {
        console.warn(`[ChatAI] ${model} returned empty text`);
        continue;
      }

      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as CreatygnComposition;
      console.log(`[ChatAI] ${model} parsed OK`);
      return parsed;
    } catch (e) {
      console.warn(`[ChatAI] ${model} error:`, e);
      continue;
    }
  }

  console.warn('[ChatAI] All models failed');
  return null;
}

/**
 * Aplica um comando de texto livre ao JSON de composição.
 * 1. Tenta regex local (parseChat + applyChatToComposition) — zero latência.
 * 2. Se regex retorna 'unknown', tenta Gemini Flash direto do browser.
 * 3. Se Gemini falha, retorna "Não entendi o comando."
 *
 * Nunca lança exceção — em erro retorna composição original.
 */
export async function applyCommandWithAI(
  composition: CreatygnComposition,
  commandText: string,
): Promise<{ composition: CreatygnComposition; usedAI: boolean; description: string }> {
  const trimmed = commandText.trim();
  if (!trimmed) return { composition, usedAI: false, description: 'Comando vazio.' };

  // ── Path 1: Regex local ─────────────────────────────────────────────────────
  const command = parseChat(trimmed);
  if (command.type !== 'unknown' && command.type !== 'regenerate_image') {
    const updated = applyChatToComposition(composition, command);
    return { composition: updated, usedAI: false, description: `✅ ${command.description}` };
  }

  // ── Path 2: Gemini Flash direto ─────────────────────────────────────────────
  console.log('[ChatAI] regex=unknown — tentando Gemini Flash para:', trimmed);
  const aiResult = await applyViaGeminiFrontend(composition, trimmed);
  if (aiResult) {
    return { composition: aiResult, usedAI: true, description: '✅ Aplicado via IA' };
  }

  // ── Path 3: Sem entendimento ────────────────────────────────────────────────
  return {
    composition,
    usedAI: false,
    description: 'Não entendi o comando. Tente: "mude o título para X", "cor de fundo azul", "fonte maior".',
  };
}
