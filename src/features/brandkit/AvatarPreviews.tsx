// src/features/brandkit/AvatarPreviews.tsx
// CREATYNG — MASTER SPEC DIFF 16.4
// Previews do Avatar: 4 estilos gerados automaticamente após criação.
// DIFF 16.6: Galeria de composições do Avatar.

import { useState } from "react";
import type { BrandAvatar } from "@/types/brandKit";
import { Button } from "@/components/ui/button";

// ─── DIFF 16.4 — PREVIEWS DO AVATAR ─────────────────────────────────────────

interface AvatarPreviewsProps {
  avatar: BrandAvatar;
  onClose: () => void;
}

const PREVIEW_STYLES = [
  { label: "Drama", preset: "drama" },
  { label: "Clean", preset: "clean" },
  { label: "Dark", preset: "dark" },
  { label: "Editorial", preset: "editorial" },
];

export function AvatarPreviews({ avatar, onClose }: AvatarPreviewsProps) {
  const hasPreviewImages = avatar.previewImages.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-zinc-500 hover:text-white">←</button>
            <div>
              <h1 className="text-xl font-bold">{avatar.name}</h1>
              <p className="text-sm text-zinc-500">
                {avatar.referenceImages.length} fotos de referência
              </p>
            </div>
          </div>
        </div>

        {/* Identity profile (se disponível) */}
        {Object.values(avatar.identityProfile).some(Boolean) && (
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 mb-6 text-sm text-zinc-400">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Perfil detectado pela IA
            </p>
            {avatar.identityProfile.gender && (
              <span className="mr-3">{avatar.identityProfile.gender}</span>
            )}
            {avatar.identityProfile.approximateAge && (
              <span className="mr-3">{avatar.identityProfile.approximateAge}</span>
            )}
            {avatar.identityProfile.hairColor && (
              <span className="mr-3">Cabelo: {avatar.identityProfile.hairColor}</span>
            )}
            {avatar.identityProfile.distinctiveFeatures && (
              <span>{avatar.identityProfile.distinctiveFeatures}</span>
            )}
          </div>
        )}

        {/* Grid de previews (4 estilos) */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Previews em 4 estilos
          </p>

          <div className="grid grid-cols-2 gap-4">
            {PREVIEW_STYLES.map((style, i) => {
              const previewUrl = avatar.previewImages[i];
              return (
                <div
                  key={style.preset}
                  className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group"
                >
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt={style.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                        <span className="px-3 py-2 text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {style.label}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      {avatar.status === "processing" ? (
                        <>
                          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-zinc-500">Gerando {style.label}...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl text-zinc-700">✦</span>
                          <span className="text-xs text-zinc-600">{style.label}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Referências */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Fotos de referência ({avatar.referenceImages.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {avatar.referenceImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className={`w-14 h-14 rounded-lg object-cover border-2 ${
                  url === avatar.bestReference ? "border-purple-500" : "border-zinc-700"
                }`}
                title={url === avatar.bestReference ? "Foto principal" : ""}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-white"
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── DIFF 16.6 — GALERIA DE COMPOSIÇÕES DO AVATAR ────────────────────────────

interface AvatarGalleryProps {
  avatar: BrandAvatar;
  onClose: () => void;
}

interface GalleryItem {
  id: string;
  imageUrl: string;
  presetName: string;
  date: string;
}

export function AvatarGallery({ avatar, onClose }: AvatarGalleryProps) {
  const [filter, setFilter] = useState<string>("all");

  // TODO: carregar do Supabase (generation_feedback WHERE avatar_id = avatar.id)
  const items: GalleryItem[] = [];

  const presetFilters = ["all", "drama", "clean", "dark", "editorial", "neon"];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onClose} className="text-zinc-500 hover:text-white">←</button>
          <div>
            <h1 className="text-xl font-bold">Galeria · {avatar.name}</h1>
            <p className="text-sm text-zinc-500">
              Todas as composições geradas com este Avatar
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          {presetFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid de composições */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-4xl text-zinc-700">✦</span>
            <p className="text-zinc-500 mt-4">
              Nenhuma composição gerada com este Avatar ainda.
            </p>
            <p className="text-xs text-zinc-600 mt-2">
              Use o Avatar no wizard para gerar suas primeiras criações.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
      <div className="aspect-square">
        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-end p-3 opacity-0 group-hover:opacity-100">
        <p className="text-xs text-white font-medium">{item.presetName}</p>
        <p className="text-xs text-zinc-400">{item.date}</p>
        <Button
          size="sm"
          className="mt-2 text-xs bg-purple-600 hover:bg-purple-500 text-white h-7 px-3"
        >
          Regerar com este estilo
        </Button>
      </div>
    </div>
  );
}
