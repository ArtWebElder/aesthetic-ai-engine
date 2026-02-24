import { createContext } from "react";
import type { Lang } from "@/i18n";

export const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}>({
  lang: "en",
  setLang: () => undefined,
  t: (key: string) => key,
});
