// src/features/editor/wizard/WizardStep2Reference.tsx
// CREATYNG — Step 2: Referência visual (galeria ou upload)

import { useState } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { REFERENCE_GALLERY, REFERENCE_CATEGORIES } from "@/data/referenceGallery";
import { cn } from "@/lib/utils";

type TabId = "gallery" | "upload";

const STYLE_COLORS: Record<string, string> = {
  "dark-dramatic": "from-zinc-900 to-purple-950",
  vibrant: "from-orange-600 to-pink-600",
  warm: "from-amber-700 to-red-800",
  minimal: "from-zinc-200 to-zinc-400",
  clean: "from-sky-200 to-sky-400",
  urban: "from-zinc-700 to-zinc-900",
  elegant: "from-rose-300 to-purple-400",
  modern: "from-cyan-500 to-blue-600",
  premium: "from-amber-400 to-yellow-600",
};

export function WizardStep2Reference() {
  const { subjectThumbnail, referenceBase64, referenceId, setReference, clearReference } =
    useWizardStore();
  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [activeCategory, setActiveCategory] = useState<string>("food");

  const filteredGallery = REFERENCE_GALLERY.filter((item) => item.category === activeCategory);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return; // Max 10MB
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string) ?? "";
      compressImage(raw, 1248, 0.88).then((compressed) => {
        setReference(compressed, "upload");
      });
    };
    reader.readAsDataURL(file);
  }

  function handleSelectGalleryItem(item: (typeof REFERENCE_GALLERY)[number]) {
    if (referenceId === item.id) {
      clearReference();
    } else {
      // Placeholder: no real imageUrl yet — use id as marker
      setReference(item.imageUrl || `gallery:${item.id}`, "gallery", item.id);
    }
  }

  function compressImage(dataUrl: string, maxSide: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  const hasValidReference = Boolean(
    referenceBase64 && !referenceBase64.startsWith("gallery:"),
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 2 — Referência</h2>
        <p className="text-muted-foreground text-sm">
          Escolha uma referência visual. A IA vai analisar o estilo, layout e cores para criar algo
          similar com o seu produto.
        </p>
      </div>

      {/* Preview side-by-side */}
      {subjectThumbnail && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-[120px] h-[120px] rounded-xl border border-border overflow-hidden bg-muted/30">
              <img
                src={subjectThumbnail}
                alt="Seu produto"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs text-muted-foreground">Seu produto</span>
          </div>

          <span className="text-2xl text-muted-foreground">→</span>

          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-[120px] h-[120px] rounded-xl border overflow-hidden",
                hasValidReference
                  ? "border-primary bg-muted/30"
                  : "border-dashed border-border bg-muted/10",
              )}
            >
              {hasValidReference ? (
                <img
                  src={referenceBase64!}
                  alt="Referência"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
                  Selecione uma referência
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Referência</span>
          </div>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("gallery")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
            activeTab === "gallery"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary",
          )}
        >
          Galeria
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
            activeTab === "upload"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary",
          )}
        >
          Upload sua referência
        </button>
      </div>

      {/* Gallery tab */}
      {activeTab === "gallery" && (
        <div className="flex flex-col gap-4">
          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            {REFERENCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary/20 text-primary border-primary"
                    : "border-border text-muted-foreground hover:border-primary",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filteredGallery.map((item) => {
              const isSelected = referenceId === item.id;
              const gradientClass = STYLE_COLORS[item.style] || "from-zinc-600 to-zinc-800";
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectGalleryItem(item)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {/* Placeholder gradient (no real images yet) */}
                  <div
                    className={cn(
                      "w-full h-full bg-gradient-to-br flex items-center justify-center",
                      gradientClass,
                    )}
                  >
                    <span className="text-white/80 text-xs font-medium text-center px-2 drop-shadow">
                      {item.name}
                    </span>
                  </div>

                  {/* Category badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-black/40 text-white/80 backdrop-blur-sm">
                    {item.category}
                  </span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        ✓
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredGallery.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma referência nesta categoria ainda.
            </p>
          )}
        </div>
      )}

      {/* Upload tab */}
      {activeTab === "upload" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col items-center justify-center w-full aspect-video max-h-56 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden relative bg-muted/30">
            {hasValidReference ? (
              <img
                src={referenceBase64!}
                alt="Referência enviada"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                <span className="text-4xl">🖼</span>
                <span className="text-sm font-medium">Arraste uma referência ou clique para subir</span>
                <span className="text-xs">PNG, JPG · Max 10MB</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
          </label>

          {hasValidReference && (
            <button
              onClick={clearReference}
              className="text-sm text-red-400 hover:text-red-300 transition-colors self-center"
            >
              Remover referência
            </button>
          )}
        </div>
      )}

      {/* Skip note */}
      {!referenceBase64 && (
        <p className="text-xs text-muted-foreground text-center">
          Sem referência? Sem problema — clique em &quot;Próximo&quot; para usar o pipeline
          baseado em presets.
        </p>
      )}
    </div>
  );
}
