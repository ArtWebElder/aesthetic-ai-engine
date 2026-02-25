import { useI18n, type Lang } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FLAG_BR = (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shrink-0">
    <rect width="20" height="14" rx="1.5" fill="#009C3B"/>
    <path d="M10 2L18 7L10 12L2 7L10 2Z" fill="#FFDF00"/>
    <circle cx="10" cy="7" r="2.8" fill="#002776"/>
    <path d="M7.5 7.3C8.2 6.2 9.5 5.8 10.8 6.2C11.5 6.4 12.1 6.8 12.5 7.3" stroke="white" strokeWidth="0.4" fill="none"/>
  </svg>
);

const FLAG_US = (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shrink-0">
    <rect width="20" height="14" rx="1.5" fill="#B22234"/>
    <rect y="1.077" width="20" height="1.077" fill="white"/>
    <rect y="3.231" width="20" height="1.077" fill="white"/>
    <rect y="5.385" width="20" height="1.077" fill="white"/>
    <rect y="7.538" width="20" height="1.077" fill="white"/>
    <rect y="9.692" width="20" height="1.077" fill="white"/>
    <rect y="11.846" width="20" height="1.077" fill="white"/>
    <rect width="8" height="7.538" fill="#3C3B6E"/>
    <circle cx="2" cy="1.5" r="0.4" fill="white"/>
    <circle cx="4" cy="1.5" r="0.4" fill="white"/>
    <circle cx="6" cy="1.5" r="0.4" fill="white"/>
    <circle cx="3" cy="2.8" r="0.4" fill="white"/>
    <circle cx="5" cy="2.8" r="0.4" fill="white"/>
    <circle cx="2" cy="4.1" r="0.4" fill="white"/>
    <circle cx="4" cy="4.1" r="0.4" fill="white"/>
    <circle cx="6" cy="4.1" r="0.4" fill="white"/>
    <circle cx="3" cy="5.4" r="0.4" fill="white"/>
    <circle cx="5" cy="5.4" r="0.4" fill="white"/>
    <circle cx="2" cy="6.7" r="0.4" fill="white"/>
    <circle cx="4" cy="6.7" r="0.4" fill="white"/>
    <circle cx="6" cy="6.7" r="0.4" fill="white"/>
  </svg>
);

const FLAG_ES = (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shrink-0">
    <rect width="20" height="14" rx="1.5" fill="#C60B1E"/>
    <rect y="3.5" width="20" height="7" fill="#FFC400"/>
    <rect y="3.5" width="20" height="7" fill="#FFC400"/>
  </svg>
);

const LOCALES: { value: Lang; label: string; flag: JSX.Element }[] = [
  { value: "en", label: "English (EN)", flag: FLAG_US },
  { value: "pt-BR", label: "Português (BR)", flag: FLAG_BR },
  { value: "es", label: "Español (ES)", flag: FLAG_ES },
];

export function LocaleDropdown({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  const current = LOCALES.find((l) => l.value === lang) ?? LOCALES[0];

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger
        className="h-8 w-auto min-w-[100px] gap-2 text-xs"
        aria-label={t("language")}
      >
        <div className="flex items-center gap-2">
          {current.flag}
          {!compact && <span>{current.value === "pt-BR" ? "PT" : current.value.toUpperCase()}</span>}
        </div>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((locale) => (
          <SelectItem key={locale.value} value={locale.value}>
            <span className="flex items-center gap-2">
              {locale.flag}
              {locale.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
