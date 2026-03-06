// src/features/editor/wizard/ExportModal.tsx
// CREATYNG — MASTER SPEC DIFF 13.1 + 13.4 + 13.5
// Modal de export multi-formato. Usa CachedGeneration do wizard store.

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  EXPORT_FORMATS,
  ExportFormat,
  ExportCategory,
  recomposeForFormat,
  renderFormatPreview,
} from "@/features/editor/engine/exportComposed";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  imageBase64: string;
  texts: { headline: string; subheadline?: string; cta?: string };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  composition: CompositionConfig;
  isPro?: boolean;
}

type Quality = "2k" | "4k";
type OutputFormat = "png" | "jpg";

interface FormatPreview {
  formatId: string;
  previewBase64: string;
  loading: boolean;
  error?: string;
}

// ─── AGRUPAMENTO ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ExportCategory, string> = {
  social: "Social Media",
  ecommerce: "E-commerce",
  ads: "Ads",
};

const CATEGORY_ORDER: ExportCategory[] = ["social", "ecommerce", "ads"];

function groupFormats(): Record<ExportCategory, ExportFormat[]> {
  const groups: Record<ExportCategory, ExportFormat[]> = {
    social: [], ecommerce: [], ads: [],
  };
  for (const fmt of EXPORT_FORMATS) {
    groups[fmt.category].push(fmt);
  }
  return groups;
}

// ─── DOWNLOAD ─────────────────────────────────────────────────────────────────

function triggerDownload(base64: string, filename: string, mime: string): void {
  const link = document.createElement("a");
  link.href = base64.startsWith("data:") ? base64 : `data:${mime};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function ExportModal({
  open, onClose,
  imageBase64, texts, presetConfig, colors, composition,
  isPro = false,
}: ExportModalProps) {
  const groups = groupFormats();

  // Seleção de formatos
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(["instagram_feed"])
  );

  // Qualidade e formato de saída
  const [quality, setQuality] = useState<Quality>("2k");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  // Previews
  const [previews, setPreviews] = useState<Map<string, FormatPreview>>(new Map());

  // Export progress
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Gerar preview para todos os formatos selecionados quando mudam
  const previewAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !imageBase64) return;

    // Cancelar previews anteriores
    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    const formatIds = Array.from(selected);

    // Marcar todos como loading
    setPreviews((prev) => {
      const next = new Map(prev);
      for (const id of formatIds) {
        if (!next.has(id)) {
          next.set(id, { formatId: id, previewBase64: "", loading: true });
        }
      }
      return next;
    });

    // Renderizar previews sequencialmente
    (async () => {
      for (const id of formatIds) {
        if (controller.signal.aborted) break;
        const fmt = EXPORT_FORMATS.find((f) => f.id === id);
        if (!fmt) continue;

        setPreviews((prev) =>
          new Map(prev).set(id, { formatId: id, previewBase64: "", loading: true })
        );

        try {
          const preview = await renderFormatPreview(
            imageBase64, texts, presetConfig, colors, composition, fmt, 280
          );
          if (!controller.signal.aborted) {
            setPreviews((prev) =>
              new Map(prev).set(id, { formatId: id, previewBase64: preview, loading: false })
            );
          }
        } catch {
          if (!controller.signal.aborted) {
            setPreviews((prev) =>
              new Map(prev).set(id, { formatId: id, previewBase64: "", loading: false, error: "Erro ao gerar preview" })
            );
          }
        }
      }
    })();

    return () => controller.abort();
  }, [open, selected, imageBase64]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFormat(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(EXPORT_FORMATS.map((f) => f.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function handleExport() {
    if (selected.size === 0) return;
    setExporting(true);
    setExportProgress(0);

    const formatIds = Array.from(selected);
    const date = formatDate();
    const mime = outputFormat === "jpg" ? "image/jpeg" : "image/png";
    const ext = outputFormat === "jpg" ? "jpg" : "png";

    for (let i = 0; i < formatIds.length; i++) {
      const id = formatIds[i];
      const fmt = EXPORT_FORMATS.find((f) => f.id === id);
      if (!fmt) continue;

      try {
        const result = await recomposeForFormat(
          imageBase64, texts, presetConfig, colors, composition, fmt,
          { quality, outputFormat }
        );
        const filename = `creatyng_${fmt.id}_${date}.${ext}`;
        triggerDownload(result, filename, mime);

        // Delay entre downloads para não bloquear o browser
        if (i < formatIds.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch {
        // continuar os próximos formatos
      }

      setExportProgress(Math.round(((i + 1) / formatIds.length) * 100));
    }

    setExporting(false);
    onClose();
  }

  const selectedCount = selected.size;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-lg font-semibold">
            ✦ Exportar Criativo
          </DialogTitle>
        </DialogHeader>

        {/* ── Preview da imagem base ── */}
        {imageBase64 && (
          <div className="flex justify-center mb-4">
            <img
              src={imageBase64}
              alt="Preview"
              className="max-h-40 rounded-lg object-contain border border-zinc-800"
            />
          </div>
        )}

        {/* ── Seleção de formatos ── */}
        <div className="space-y-4 mb-4">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {groups[cat].map((fmt) => {
                  const isSelected = selected.has(fmt.id);
                  const preview = previews.get(fmt.id);

                  return (
                    <label
                      key={fmt.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                      onClick={() => toggleFormat(fmt.id)}
                    >
                      {/* Preview miniatura */}
                      <div
                        className="flex-shrink-0 rounded overflow-hidden bg-zinc-900 flex items-center justify-center"
                        style={{
                          width: 48,
                          height: Math.round(48 * (fmt.h / fmt.w)),
                          maxHeight: 64,
                        }}
                      >
                        {preview?.loading && (
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {preview?.previewBase64 && !preview.loading && (
                          <img
                            src={preview.previewBase64}
                            alt={fmt.label}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!preview && (
                          <div className="w-4 h-4 bg-zinc-700 rounded" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            className="pointer-events-none border-zinc-600"
                            onCheckedChange={() => {}}
                          />
                          <span className="text-sm font-medium text-zinc-200 truncate">
                            {fmt.label}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 ml-6">
                          {fmt.ratio} · {fmt.w}×{fmt.h}px
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Ações de seleção ── */}
        <div className="flex gap-2 mb-4">
          <button
            className="text-xs text-purple-400 hover:text-purple-300 underline"
            onClick={selectAll}
          >
            Selecionar todos
          </button>
          <span className="text-zinc-700">·</span>
          <button
            className="text-xs text-zinc-500 hover:text-zinc-400 underline"
            onClick={selectNone}
          >
            Limpar seleção
          </button>
        </div>

        {/* ── Qualidade + Formato ── */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800 mb-4">
          {/* Qualidade */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Qualidade
            </p>
            <RadioGroup value={quality} onValueChange={(v) => setQuality(v as Quality)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="2k" id="q-2k" />
                <Label htmlFor="q-2k" className="text-sm text-zinc-300 cursor-pointer">
                  2K <span className="text-zinc-500">(recomendado)</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="4k" id="q-4k" disabled={!isPro} />
                <Label
                  htmlFor="q-4k"
                  className={`text-sm cursor-pointer ${isPro ? "text-zinc-300" : "text-zinc-600"}`}
                >
                  4K {!isPro && <span className="text-xs text-yellow-500 ml-1">PRO</span>}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Formato */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Formato
            </p>
            <RadioGroup value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="png" id="f-png" />
                <Label htmlFor="f-png" className="text-sm text-zinc-300 cursor-pointer">
                  PNG
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="jpg" id="f-jpg" />
                <Label htmlFor="f-jpg" className="text-sm text-zinc-300 cursor-pointer">
                  JPG <span className="text-zinc-500">(85%)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* ── Progress bar durante export ── */}
        {exporting && (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-zinc-400">
              Exportando {exportProgress}%...
            </p>
            <Progress value={exportProgress} className="h-1.5 bg-zinc-800" />
          </div>
        )}

        {/* ── Botões ── */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={exporting}
            className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleExport}
            disabled={selectedCount === 0 || exporting}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6"
          >
            {exporting
              ? "Exportando..."
              : selectedCount === 0
              ? "Selecione um formato"
              : `✦ Exportar ${selectedCount} formato${selectedCount > 1 ? "s" : ""}`}
          </Button>
        </div>

        {selectedCount > 1 && !exporting && (
          <p className="text-xs text-zinc-500 text-center mt-2">
            {selectedCount} arquivos serão baixados individualmente
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
