// src/features/editor/wizard/WizardStep3Text.tsx
// CREATYNG — MASTER SPEC DIFF 9.3 (FontSelector integrado) + Food/Pop fields

import { useDeferredValue, useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { useWizardStore } from "@/stores/useWizardStore";
import { TextStylePicker } from "@/components/TextStylePicker";
import { FontSelector } from "@/components/FontSelector";
import { PreviewCanvas } from "./PreviewCanvas";
import type { CreatygnPreset, ColorConfig } from "@/types/preset";
import { DEFAULT_COLORS } from "@/features/editor/engine/cssVarsInjector";

const inputClass =
  "w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm";

// Fontes sugeridas por preset de texto
const SUGGESTED_FONTS: Record<string, string[]> = {
  "sys-txt-impact":   ["Anton", "Bebas Neue", "Oswald", "Black Han Sans"],
  "sys-txt-clean":    ["Bebas Neue", "Oswald", "Barlow Condensed", "Teko"],
  "sys-txt-dark":     ["Cinzel Decorative", "Cinzel", "Cormorant Garamond"],
  "sys-txt-neon":     ["Rajdhani", "Orbitron", "Exo 2", "Share Tech Mono"],
  "sys-txt-street":   ["Black Han Sans", "Anton", "Oswald"],
  "sys-txt-luxury":   ["Cormorant Garamond", "Cinzel", "Montserrat"],
  "sys-txt-sport":    ["Teko", "Barlow Condensed", "Oswald", "Rajdhani"],
  "sys-txt-minimal":  ["Inter", "Space Grotesk", "DM Sans", "Plus Jakarta Sans"],
  "sys-txt-food-pop": ["Montserrat", "Anton", "Oswald", "Bebas Neue"],
};

const PRICE_PREFIXES = ["R$", "US$", "$", "€", ""];
const PRICE_SUFFIXES = ["CADA", "A PARTIR DE", "POR APENAS", "NO PIX", ""];

export function WizardStep3Text() {
  const {
    headline,
    subheadline,
    cta,
    setHeadline,
    setSubheadline,
    setCta,
    mode,
    selectedTextPresetId,
    selectTextPreset,
    activePresetConfig,
    setPresetOverride,
    whatsapp,
    instagram,
    price,
    freeInstructions,
    setWhatsapp,
    setInstagram,
    setPrice,
    setFreeInstructions,
  } = useWizardStore();

  // Debounce do texto para não redesenhar mini-canvas a cada keystroke
  const deferredHeadline = useDeferredValue(headline);

  const colors: ColorConfig = activePresetConfig.colors ?? DEFAULT_COLORS;

  // ── Color palette state ────────────────────────────────────────────────────
  const [paletteColors, setPaletteColors] = useState({
    primary: colors.primary || "#7B2FFF",
    accent: colors.secondary || "#FF5500",
  });
  const [activeColorKey, setActiveColorKey] = useState<"primary" | "accent" | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setActiveColorKey(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectTextPreset(preset: CreatygnPreset) {
    selectTextPreset(preset.id);
  }

  function handlePriceChange(field: "value" | "prefix" | "suffix", val: string) {
    const current = price ?? { value: "", prefix: "R$", suffix: "" };
    const updated = { ...current, [field]: val };
    // Se todos os campos estiverem vazios, seta null
    if (!updated.value && !updated.prefix && !updated.suffix) {
      setPrice(null);
    } else {
      setPrice(updated);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 3 — Textos</h2>
        <p className="text-muted-foreground text-sm">
          Os textos são compostos sobre a imagem com tipografia real — nunca gerados pela IA.
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Headline <span className="text-muted-foreground font-normal">(principal)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ex: DO TAMANHO DA SUA FOME"
          className={inputClass}
        />
      </div>

      {/* CTA sempre visível */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">CTA</label>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="Ex: PEÇA JÁ"
          className={inputClass}
        />
      </div>

      {/* Subheadline — só no modo advanced */}
      {mode === "advanced" && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Subheadline</label>
          <input
            type="text"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            placeholder="Ex: Sua jornada começa aqui"
            className={inputClass}
          />
        </div>
      )}

      {/* TextStylePicker — cards com preview ao vivo */}
      <TextStylePicker
        selectedId={selectedTextPresetId}
        previewText={deferredHeadline}
        colors={colors}
        onSelect={handleSelectTextPreset}
      />

      {/* Preview canvas — zona de texto + sujeito */}
      <PreviewCanvas />

      {/* ── Paleta de cores ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Paleta de cores
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
          {(["primary", "accent"] as const).map((key) => {
            const color = paletteColors[key];
            const isOpen = activeColorKey === key;
            const label = key === "primary" ? "Principal" : "Destaque";
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setActiveColorKey(isOpen ? null : key)}
                  style={{
                    width: 48, height: 48, borderRadius: 99, background: color,
                    border: isOpen ? '3px solid hsl(var(--foreground))' : '3px solid hsl(var(--border))',
                    boxShadow: isOpen
                      ? '0 0 0 2px #ff713d, 0 4px 12px rgba(0,0,0,0.2)'
                      : '0 2px 8px rgba(0,0,0,0.15)',
                    cursor: 'pointer', transition: 'all 200ms',
                  }}
                  title={label}
                />
                <span style={{ fontSize: 10.5, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{label}</span>
              </div>
            );
          })}

          {/* Modern color picker popover */}
          {activeColorKey && (
            <div
              ref={colorPickerRef}
              style={{
                position: 'absolute', top: 64, left: 0, zIndex: 50,
                background: 'hsl(var(--card))', borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid hsl(var(--border))',
                padding: 16, minWidth: 220,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {activeColorKey === "primary" ? "Cor principal" : "Cor de destaque"}
              </div>
              <HexColorPicker
                color={paletteColors[activeColorKey]}
                onChange={(c) => setPaletteColors(prev => ({ ...prev, [activeColorKey!]: c }))}
                style={{ width: '100%', height: 160 }}
              />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: paletteColors[activeColorKey], flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'hsl(var(--foreground))', fontWeight: 600 }}>
                  {paletteColors[activeColorKey].toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setActiveColorKey(null)}
                style={{
                  marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >Aplicar</button>
            </div>
          )}
        </div>
      </div>

      {/* FontSelector — override da fonte do preset ativo */}
      {mode === "advanced" && (
        <FontSelector
          value={activePresetConfig.text?.headlineFont ?? "Anton"}
          previewText={headline}
          suggestedFonts={SUGGESTED_FONTS[selectedTextPresetId ?? ""] ?? ["Anton", "Bebas Neue"]}
          onChange={(font) => setPresetOverride("text.headlineFont", font)}
          label="Fonte principal (override)"
        />
      )}

      {/* ── INFORMAÇÕES ADICIONAIS ─────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-border flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Informações adicionais
        </p>

        {/* Preço — 3 campos inline */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Preço <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
          </label>
          <div className="flex gap-2">
            {/* Prefixo */}
            <select
              value={price?.prefix ?? "R$"}
              onChange={(e) => handlePriceChange("prefix", e.target.value)}
              className="w-[25%] px-2 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PRICE_PREFIXES.map((p) => (
                <option key={p} value={p}>{p || "—"}</option>
              ))}
            </select>
            {/* Valor */}
            <input
              type="text"
              value={price?.value ?? ""}
              onChange={(e) => handlePriceChange("value", e.target.value)}
              placeholder="29,90"
              className="w-[35%] px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {/* Sufixo */}
            <select
              value={price?.suffix ?? ""}
              onChange={(e) => handlePriceChange("suffix", e.target.value)}
              className="w-[40%] px-2 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PRICE_SUFFIXES.map((s) => (
                <option key={s} value={s}>{s || "—"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">WhatsApp</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
              📱
            </span>
            <input
              type="tel"
              value={whatsapp ?? ""}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Instagram</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none font-medium">
              @
            </span>
            <input
              type="text"
              value={instagram ?? ""}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="seuperfil"
              className="w-full pl-7 pr-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Instruções adicionais */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Direção criativa{" "}
            <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
          </label>
          <textarea
            value={freeInstructions ?? ""}
            onChange={(e) => setFreeInstructions(e.target.value)}
            placeholder="Ex: quero algo agressivo e apetitoso, com ingredientes voando"
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
