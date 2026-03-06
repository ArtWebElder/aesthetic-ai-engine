// src/components/FontSelector.tsx
// CREATYNG — MASTER SPEC DIFF 9.3
// Seletor de fonte como override sobre o text preset ativo.
// NUNCA criar estado próprio — usa setPresetOverride do wizard store.

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FontSelectorProps {
  value: string;                       // fonte atual (do activePresetConfig)
  previewText: string;                 // texto do headline do usuário
  suggestedFonts: string[];           // sugestões baseadas no text preset ativo
  onChange: (fontName: string) => void; // chama setPresetOverride
  label?: string;
}

// Catálogo de fontes disponíveis (curado)
const ALL_FONTS = [
  "Anton", "Bebas Neue", "Oswald", "Black Han Sans", "Teko", "Barlow Condensed",
  "Rajdhani", "Share Tech Mono", "Cinzel Decorative", "Cinzel",
  "Cormorant Garamond", "Montserrat", "Inter", "Space Grotesk", "DM Sans",
  "Plus Jakarta Sans", "Orbitron", "Exo 2", "Nunito", "Roboto Condensed",
];

const LOADED_FONTS = new Set<string>();

async function loadGoogleFont(fontName: string): Promise<void> {
  if (LOADED_FONTS.has(fontName)) return;
  LOADED_FONTS.add(fontName);
  const encoded = fontName.replace(/ /g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;700;900&display=swap`;
  document.head.appendChild(link);
  await document.fonts.ready;
}

export function FontSelector({
  value,
  previewText,
  suggestedFonts,
  onChange,
  label = "Fonte principal",
}: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Carrega fontes sugeridas quando o seletor abre (não no mount)
  useEffect(() => {
    if (!open) return;
    Promise.all([value, ...suggestedFonts].map(loadGoogleFont)).then(() =>
      setFontsLoaded(true)
    );
  }, [open, value, suggestedFonts]);

  const preview = previewText || "EXEMPLO";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-border bg-background hover:border-primary transition-colors text-sm"
      >
        <span style={{ fontFamily: `"${value}", sans-serif` }}>{value}</span>
        <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {/* Preview da fonte atual */}
      <div
        className="px-3 py-2 rounded-md bg-muted text-foreground text-2xl font-bold overflow-hidden"
        style={{ fontFamily: `"${value}", sans-serif` }}
      >
        {preview.toUpperCase()}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-background shadow-lg">
          {/* Sugeridas */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Sugeridas para este preset</p>
            <div className="flex flex-wrap gap-2">
              {suggestedFonts.map((font) => (
                <button
                  key={font}
                  onClick={async () => {
                    await loadGoogleFont(font);
                    onChange(font);
                    setOpen(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-colors",
                    value === font
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary"
                  )}
                  style={{ fontFamily: fontsLoaded ? `"${font}", sans-serif` : undefined }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Todas as fontes */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Todas as fontes</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {ALL_FONTS.filter((f) => !suggestedFonts.includes(f)).map((font) => (
                <button
                  key={font}
                  onClick={async () => {
                    await loadGoogleFont(font);
                    onChange(font);
                    setOpen(false);
                  }}
                  className={cn(
                    "px-2 py-1.5 rounded-md border text-sm text-left transition-colors truncate",
                    value === font
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
