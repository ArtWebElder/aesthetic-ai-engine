// src/features/brandkit/BrandKitPage.tsx
// CREATYNG — MASTER SPEC DIFF 16.2
// Tela principal de Brand Kits: listagem + criação/edição.

import { useEffect, useState } from "react";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { BrandKit, BrandKitDraft } from "@/types/brandKit";
import { DEFAULT_BRAND_KIT_DRAFT } from "@/types/brandKit";
import { Button } from "@/components/ui/button";
import { BrandKitEditor } from "./BrandKitEditor";

export function BrandKitPage() {
  const { kits, loading, loadKits, deleteKit, setDefault } = useBrandKitStore();
  const [editingKit, setEditingKit] = useState<BrandKit | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  function handleEdit(kit: BrandKit) {
    setEditingKit(kit);
    setCreating(false);
  }

  function handleNew() {
    setEditingKit(null);
    setCreating(true);
  }

  function handleClose() {
    setEditingKit(null);
    setCreating(false);
  }

  if (editingKit || creating) {
    return (
      <BrandKitEditor
        kit={editingKit ?? undefined}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Brand Kits</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Salve a identidade visual das suas marcas para usar em qualquer geração.
            </p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
          >
            + Novo Kit
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Carregando...
          </div>
        )}

        {/* Grid de kits */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {kits.map((kit) => (
              <BrandKitCard
                key={kit.id}
                kit={kit}
                onEdit={() => handleEdit(kit)}
                onDelete={() => deleteKit(kit.id)}
                onSetDefault={() => setDefault(kit.id)}
              />
            ))}

            {/* Card de novo kit */}
            <button
              onClick={handleNew}
              className="flex flex-col items-center justify-center gap-3 h-48 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500 hover:bg-purple-500/5 transition-colors text-zinc-500 hover:text-purple-400"
            >
              <span className="text-3xl">+</span>
              <span className="text-sm font-medium">Novo Brand Kit</span>
            </button>
          </div>
        )}

        {!loading && kits.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500 mb-4">Você ainda não tem nenhum Brand Kit.</p>
            <Button
              onClick={handleNew}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white"
            >
              Criar meu primeiro kit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────

interface BrandKitCardProps {
  kit: BrandKit;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function BrandKitCard({ kit, onEdit, onDelete, onSetDefault }: BrandKitCardProps) {
  return (
    <div className="relative flex flex-col h-48 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors">

      {/* Faixa de cor primária */}
      <div
        className="h-2 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${kit.colors.primary}, ${kit.colors.secondary})` }}
      />

      <div className="flex-1 p-4 flex flex-col gap-2">
        {/* Header do card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {kit.logoUrl ? (
              <img src={kit.logoUrl} alt="Logo" className="w-10 h-10 rounded object-contain bg-zinc-800" />
            ) : (
              <div
                className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg"
                style={{ background: kit.colors.primary }}
              >
                {kit.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-white text-sm leading-tight">{kit.name}</p>
              {kit.isDefault && (
                <span className="text-xs text-purple-400">● Padrão</span>
              )}
            </div>
          </div>
        </div>

        {/* Paleta de cores */}
        <div className="flex items-center gap-1.5">
          {[kit.colors.primary, kit.colors.secondary, kit.colors.neutral, ...kit.colors.extras.slice(0, 2)].map(
            (color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-zinc-700"
                style={{ background: color }}
                title={color}
              />
            )
          )}
        </div>

        {/* Fonte */}
        <p className="text-xs text-zinc-500">
          {kit.fonts.headline} · {kit.style.preset}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <button
          onClick={onEdit}
          className="flex-1 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded hover:border-zinc-500 transition-colors"
        >
          Editar
        </button>
        {!kit.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex-1 py-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-800 rounded hover:border-purple-600 transition-colors"
          >
            Usar como padrão
          </button>
        )}
        <button
          onClick={onDelete}
          className="py-1.5 px-2 text-xs text-zinc-600 hover:text-red-400 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
