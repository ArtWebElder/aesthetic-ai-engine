import { useContext } from "react";
import { I18nContext } from "@/i18n/context";
import en from "@/i18n/locales/en.json";
import ptBR from "@/i18n/locales/pt-BR.json";
import es from "@/i18n/locales/es.json";

export type Lang = "en" | "pt-BR" | "es";

const STORAGE_KEY = "mi_lang";

const dictionaries: Record<Lang, Record<string, string>> = {
  en,
  "pt-BR": ptBR,
  es,
};
export function normalizeLang(input?: string | null): Lang {
  const value = (input ?? "").toLowerCase();
  if (value.startsWith("pt")) return "pt-BR";
  if (value.startsWith("es")) return "es";
  return "en";
}

export function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return normalizeLang(stored);
  // Check navigator.languages first (more specific), then navigator.language
  const languages = window.navigator.languages ?? [];
  for (const l of languages) {
    const norm = normalizeLang(l);
    if (norm !== "en") return norm; // prefer first non-English match
  }
  return normalizeLang(window.navigator.language);
}

export function persistLang(lang: Lang): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(.*?)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function createTranslator(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const table = dictionaries[lang] ?? dictionaries.en;
    const fallback = dictionaries.en;
    const template = table[key] ?? fallback[key] ?? key;
    const result = interpolate(template, vars);
    if (import.meta.env.DEV) {
      const remaining = result.match(/\{(\w+)\}/g);
      if (remaining) {
        console.warn(`[i18n] Missing interpolation params for key "${key}": ${remaining.join(", ")}`);
      }
    }
    return result;
  };
}

export function useI18n(): {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
} {
  return useContext(I18nContext);
}

