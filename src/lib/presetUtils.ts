// src/lib/presetUtils.ts
// CREATYNG — Helpers de preset.
// Todas as operações com presets passam por aqui — nunca acessar systemPresets diretamente.

import type { CreatygnPreset, PresetConfig } from "@/types/preset";
import {
  PRESET_BY_ID,
  SYSTEM_TEXT_PRESETS,
  PRESET_AFFINITY,
} from "@/data/systemPresets";

// ─── LOOKUP ───────────────────────────────────────────────────────────────────

/** Retorna o preset pelo ID. Undefined se não existir. */
export function getPresetById(id: string): CreatygnPreset | undefined {
  return PRESET_BY_ID.get(id);
}

// ─── SUGESTÃO AUTOMÁTICA ──────────────────────────────────────────────────────

/** Retorna o text preset sugerido para um image preset.
 *  Usa a tabela PRESET_AFFINITY. Fallback: sys-txt-clean. */
export function getSuggestedTextPreset(imagePresetId: string): CreatygnPreset {
  const suggestedId = PRESET_AFFINITY[imagePresetId] ?? "sys-txt-clean";
  return PRESET_BY_ID.get(suggestedId) ?? SYSTEM_TEXT_PRESETS[1];
}

// ─── OVERRIDE IMUTÁVEL ────────────────────────────────────────────────────────

/** Aplica um override pontual em um PresetConfig usando dot notation.
 *  NÃO muta o objeto original — retorna sempre uma cópia nova.
 *
 *  Exemplos de key:
 *    'text.headlineFont'     → config.text.headlineFont
 *    'colors.primary'        → config.colors.primary
 *    'composition.textPosition' → config.composition.textPosition
 */
export function applyPresetOverride(
  base: PresetConfig,
  key: string,
  value: unknown
): PresetConfig {
  const parts = key.split(".");
  if (parts.length < 2) return base;

  const [section, ...rest] = parts;
  const field = rest.join(".");

  const sectionKey = section as keyof PresetConfig;
  const currentSection = base[sectionKey] ?? {};

  const updatedSection = setNestedValue(currentSection as Record<string, unknown>, field, value);

  return {
    ...base,
    [sectionKey]: updatedSection,
  };
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split(".");
  if (parts.length === 1) {
    return { ...obj, [parts[0]]: value };
  }
  const [head, ...tail] = parts;
  const nested = (obj[head] ?? {}) as Record<string, unknown>;
  return {
    ...obj,
    [head]: setNestedValue(nested, tail.join("."), value),
  };
}

// ─── BUILD ACTIVE CONFIG ──────────────────────────────────────────────────────

/** Constrói a PresetConfig ativa combinando o preset base com overrides pontuais.
 *  Overrides são aplicados na ordem em que aparecem no objeto.
 *
 *  Exemplo:
 *    buildActiveConfig('sys-img-drama', { 'text.headlineFont': 'Bebas Neue' })
 *    → config do drama + fonte substituída
 */
export function buildActiveConfig(
  presetId: string,
  overrides: Record<string, unknown> = {}
): PresetConfig {
  const preset = getPresetById(presetId);
  if (!preset) return {};

  let config: PresetConfig = { ...preset.config };

  for (const [key, value] of Object.entries(overrides)) {
    config = applyPresetOverride(config, key, value);
  }

  return config;
}

// ─── DEFAULTS DO WIZARD ───────────────────────────────────────────────────────

/** PresetConfig vazia para inicializar o wizard sem nenhum preset selecionado. */
export const EMPTY_PRESET_CONFIG: PresetConfig = {};

/** Config padrão quando nenhum preset de imagem foi selecionado. */
export const DEFAULT_IMAGE_PRESET_ID = "sys-img-drama";

/** Config padrão quando nenhum preset de texto foi selecionado. */
export const DEFAULT_TEXT_PRESET_ID = "sys-txt-impact";
