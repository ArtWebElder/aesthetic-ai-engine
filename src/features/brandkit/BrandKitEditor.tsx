// src/features/brandkit/BrandKitEditor.tsx
// CREATYNG — MASTER SPEC DIFF 16.2
// Formulário de criação/edição de Brand Kit.
// Reutiliza FontSelector e PresetGrid da Feature 9.

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { BrandKit, BrandKitDraft } from "@/types/brandKit";
import { DEFAULT_BRAND_KIT_DRAFT } from "@/types/brandKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HexColorPicker } from "react-colorful";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";
import { PresetGrid } from "@/components/PresetGrid";
import FontSelector from "@/components/FontSelector";
import type { CreatygnPreset } from "@/types/preset";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface BrandKitEditorProps {
  kit?: BrandKit;                  // undefined = criar novo
  onClose: () => void;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function BrandKitEditor({ kit, onClose }: BrandKitEditorProps) {
  const { createKit, updateKit } = useBrandKitStore();
  const isNew = !kit;

  const [draft, setDraft] = useState<BrandKitDraft>(
    kit
      ? {
          name: kit.name,
          logoUrl: kit.logoUrl,
          colors: { ...kit.colors },
          fonts: { ...kit.fonts },
          style: { ...kit.style },
          isDefault: kit.isDefault,
        }
      : { ...DEFAULT_BRAND_KIT_DRAFT }
  );

  const [saving, setSaving] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<"primary" | "secondary" | "neutral" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setColor(key: "primary" | "secondary" | "neutral", value: string) {
    setDraft((d) => ({ ...d, colors: { ...d.colors, [key]: value } }));
  }

  function setFont(key: "headline" | "body", value: string) {
    setDraft((d) => ({ ...d, fonts: { ...d.fonts, [key]: value } }));
  }

  function setStylePreset(preset: CreatygnPreset) {
    const stylePreset = preset.config.image?.preset ?? "drama";
    setDraft((d) => ({
      ...d,
      style: {
        ...d.style,
        preset: stylePreset as BrandKitDraft["style"]["preset"],
      },
    }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraft((d) => ({ ...d, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (isNew) {
        await createKit(draft);
      } else {
        await updateKit(kit!.id, draft);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const selectedImagePreset = SYSTEM_IMAGE_PRESETS.find(
    (p) => p.config.image?.preset === draft.style.preset
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Pencil className="w-5 h-5" /> {isNew ? "Novo Brand Kit" : `Editar · ${kit!.name}`}
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        <div className="space-y-8">

          {/* Nome */}
          <div>
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-2 block">
              Nome da marca
            </Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex: Minha Marca"
              className="bg-zinc-900 border-zinc-700 text-white focus:border-purple-500"
            />
          </div>

          {/* Logo */}
          <div>
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-2 block">
              Logo
            </Label>
            <div className="flex items-center gap-4">
              {draft.logoUrl ? (
                <img
                  src={draft.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-contain bg-zinc-900 border border-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-sm">
                  Logo
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="border-zinc-700 text-zinc-400 hover:text-white text-sm"
                >
                  {draft.logoUrl ? "Trocar logo" : "Upload logo"}
                </Button>
                {draft.logoUrl && (
                  <button
                    className="ml-2 text-xs text-zinc-600 hover:text-red-400"
                    onClick={() => setDraft((d) => ({ ...d, logoUrl: undefined }))}
                  >
                    Remover
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>

          {/* Cores */}
          <div>
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-3 block">
              Cores
            </Label>
            <div className="flex gap-4 flex-wrap">
              {(["primary", "secondary", "neutral"] as const).map((colorKey) => {
                const labels = { primary: "Primária", secondary: "Secundária", neutral: "Neutra" };
                return (
                  <div key={colorKey} className="relative">
                    <button
                      onClick={() =>
                        setActiveColorPicker(activeColorPicker === colorKey ? null : colorKey)
                      }
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div
                        className="w-10 h-10 rounded-full border-2 border-zinc-700 group-hover:border-zinc-500 transition-colors"
                        style={{ background: draft.colors[colorKey] }}
                      />
                      <span className="text-xs text-zinc-500">{labels[colorKey]}</span>
                    </button>

                    {activeColorPicker === colorKey && (
                      <div className="absolute z-50 top-14 left-0">
                        <HexColorPicker
                          color={draft.colors[colorKey]}
                          onChange={(v) => setColor(colorKey, v)}
                        />
                        <button
                          onClick={() => setActiveColorPicker(null)}
                          className="mt-2 w-full text-xs text-zinc-500 hover:text-white"
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fontes */}
          <div>
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-3 block">
              Fontes
            </Label>
            <div className="space-y-3">
              <FontSelector
                value={draft.fonts.headline}
                previewText={draft.name || "Headline"}
                suggestedFonts={["Anton", "Bebas Neue", "Oswald", "Cinzel", "Teko"]}
                onChange={(f) => setFont("headline", f)}
                label="Fonte do título"
              />
              <FontSelector
                value={draft.fonts.body}
                previewText="Texto de apoio da marca"
                suggestedFonts={["Inter", "Montserrat", "Oswald", "Barlow Condensed", "Share Tech Mono"]}
                onChange={(f) => setFont("body", f)}
                label="Fonte do corpo"
              />
            </div>
          </div>

          {/* Estilo padrão */}
          <div>
            <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-3 block">
              Estilo visual padrão
            </Label>
            <PresetGrid
              presets={SYSTEM_IMAGE_PRESETS}
              selectedPresetId={selectedImagePreset?.id}
              onSelect={setStylePreset}
              columns={3}
            />
          </div>

          {/* Padrão */}
          <div className="flex items-center gap-3 py-3 border-t border-zinc-800">
            <input
              type="checkbox"
              id="isDefault"
              checked={draft.isDefault}
              onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
              className="accent-purple-500 w-4 h-4 cursor-pointer"
            />
            <Label htmlFor="isDefault" className="text-sm text-zinc-400 cursor-pointer">
              Usar este kit como padrão no wizard
            </Label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !draft.name.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold flex-1"
            >
              {saving ? "Salvando..." : isNew ? "Criar Brand Kit" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
