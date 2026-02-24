import { useMemo, useState, type ReactNode } from "react";
import { I18nContext } from "@/i18n/context";
import { createTranslator, getInitialLang, persistLang, type Lang } from "@/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = getInitialLang();
    persistLang(initial);
    return initial;
  });
  const t = useMemo(() => createTranslator(lang), [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (next: Lang) => {
        persistLang(next);
        setLangState(next);
      },
      t,
    }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
