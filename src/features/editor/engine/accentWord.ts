// src/features/editor/engine/accentWord.ts
// CREATYNG — MASTER SPEC DIFF TR.4

export interface AccentParts {
  before: string;
  accent: string;
  after: string;
}

/**
 * Detecta automaticamente qual palavra destacar.
 * - 1 palavra → destaca ela mesma
 * - 2 palavras → destaca a última
 * - 3+ palavras → destaca as últimas 2 palavras
 */
export function detectAccentWord(text: string): AccentParts {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { before: "", accent: text, after: "" };
  if (words.length === 1) return { before: "", accent: words[0], after: "" };
  if (words.length === 2) return { before: words[0], accent: words[1], after: "" };

  const accentWords = words.slice(-2);
  const beforeWords = words.slice(0, -2);
  return {
    before: beforeWords.join(" "),
    accent: accentWords.join(" "),
    after: "",
  };
}

/**
 * Parseia marcação manual com [colchetes].
 * Exemplo: "EU [QUERIA] SER FORTE" → before="EU", accent="QUERIA", after="SER FORTE"
 * Se não há colchetes, retorna o texto completo sem accent.
 */
export function parseManualAccent(text: string): AccentParts {
  const match = text.match(/^(.*?)\[(.+?)\](.*)$/);
  if (!match) return { before: text, accent: "", after: "" };
  return {
    before: match[1].trim(),
    accent: match[2].trim(),
    after: match[3].trim(),
  };
}

/**
 * Retorna HTML com <span> na accent word.
 * A accent word usa a CSS var --accent-word.
 */
export function renderAccentWordHTML(
  text: string,
  accentColor: string,
  useAuto: boolean
): string {
  const parts = useAuto ? detectAccentWord(text) : parseManualAccent(text);
  if (!parts.accent) return `<span>${escapeHtml(text)}</span>`;

  return [
    parts.before ? `<span>${escapeHtml(parts.before)} </span>` : "",
    `<span style="color:${accentColor}">${escapeHtml(parts.accent)}</span>`,
    parts.after ? `<span> ${escapeHtml(parts.after)}</span>` : "",
  ].join("");
}

/**
 * Versão para Canvas 2D: retorna as partes para desenho sequencial.
 * Usar quando renderizar diretamente em ctx — não via innerHTML.
 */
export function getAccentParts(text: string, useAuto: boolean): AccentParts {
  return useAuto ? detectAccentWord(text) : parseManualAccent(text);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
