// src/features/brandkit/AvatarCreator.tsx
// CREATYNG — MASTER SPEC DIFF 16.3
// Fluxo de criação do Avatar: upload de fotos + processamento + identityProfile.

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { BrandAvatar } from "@/types/brandKit";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface AvatarCreatorProps {
  brandKitId: string;
  onCreated: (avatar: BrandAvatar) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

interface UploadedPhoto {
  url: string;           // base64 para preview local
  file: File;
}

// ─── REQUISITOS VISUAIS ───────────────────────────────────────────────────────

const REQUIREMENTS_OK = [
  "Rosto visível e nítido",
  "Boa iluminação",
  "Ângulos variados (frontal, 3/4, perfil)",
];

const REQUIREMENTS_NOK = [
  "Não usar fotos em grupo",
  "Não usar fotos com óculos escuros",
  "Não usar fotos desfocadas",
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function AvatarCreator({ brandKitId, onCreated, onCancel }: AvatarCreatorProps) {
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload de fotos ────────────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 10 - photos.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => {
          if (prev.length >= 10) return prev;
          return [...prev, { url: ev.target?.result as string, file }];
        });
      };
      reader.readAsDataURL(file);
    });

    // reset input para permitir nova seleção
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Processamento ──────────────────────────────────────────────────────────

  async function handleProcess() {
    if (photos.length < 5 || !name.trim()) return;
    setStep(3);
    setProcessing(true);

    const steps = [
      { label: "Analisando suas fotos...", pct: 20, ms: 1500 },
      { label: "Criando perfil de identidade...", pct: 60, ms: 2000 },
      { label: "Finalizando Avatar...", pct: 90, ms: 1000 },
    ];

    for (const s of steps) {
      setProgressLabel(s.label);
      await new Promise((r) => setTimeout(r, s.ms));
      setProgress(s.pct);
    }

    // TODO: chamar Edge Function que analisa fotos com IA e gera identityProfile
    // Por ora: criar avatar com dados mockados
    const now = new Date().toISOString();
    const avatar: BrandAvatar = {
      id: crypto.randomUUID(),
      brandKitId,
      userId: "local",
      name: name.trim(),
      description: `Avatar de ${name.trim()}.`,
      referenceImages: photos.map((p) => p.url),
      bestReference: photos[0]?.url,
      identityProfile: {},
      previewImages: [],              // será preenchido no DIFF 16.4
      status: "ready",
      createdAt: now,
      updatedAt: now,
    };

    setProgress(100);
    setProgressLabel("Avatar pronto!");
    await new Promise((r) => setTimeout(r, 800));

    setProcessing(false);
    onCreated(avatar);
  }

  // ─── RENDERIZAÇÃO POR STEP ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onCancel} className="text-zinc-500 hover:text-white">←</button>
          <h1 className="text-xl font-bold">Criar Avatar</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step >= s
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-zinc-700 text-zinc-600"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-px w-10 ${step > s ? "bg-purple-600" : "bg-zinc-800"}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Upload de fotos ── */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-zinc-300">
              Envie entre <span className="text-white font-semibold">5 e 10 fotos</span> suas para criar seu Avatar.
            </p>

            {/* Requisitos */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div>
                {REQUIREMENTS_OK.map((r) => (
                  <div key={r} className="flex items-start gap-2 text-sm text-zinc-300 mb-1">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span> {r}
                  </div>
                ))}
              </div>
              <div>
                {REQUIREMENTS_NOK.map((r) => (
                  <div key={r} className="flex items-start gap-2 text-sm text-zinc-500 mb-1">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span> {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid de fotos */}
            <div className="grid grid-cols-5 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {photos.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-purple-500 flex items-center justify-center text-zinc-600 hover:text-purple-400 transition-colors text-xl"
                >
                  +
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-600">
              {photos.length}/10 fotos · Mínimo 5
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-zinc-700 text-zinc-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={photos.length < 5}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
              >
                Próximo →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Nome e descrição ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-2 block">
                Nome do Avatar
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Elder Silva"
                className="bg-zinc-900 border-zinc-700 text-white focus:border-purple-500"
                autoFocus
              />
              <p className="text-xs text-zinc-500 mt-2">
                A IA irá gerar uma descrição automática baseada nas suas fotos.
              </p>
            </div>

            {/* Preview das fotos selecionadas */}
            <div className="flex gap-2 flex-wrap">
              {photos.slice(0, 5).map((photo, i) => (
                <img
                  key={i}
                  src={photo.url}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-700"
                />
              ))}
              {photos.length > 5 && (
                <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs text-zinc-500">
                  +{photos.length - 5}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-zinc-700 text-zinc-400"
              >
                ← Voltar
              </Button>
              <Button
                onClick={handleProcess}
                disabled={!name.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                Criar Avatar
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Processamento ── */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            {processing ? (
              <>
                <div className="w-16 h-16 mx-auto border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-300">{progressLabel}</p>
                <Progress value={progress} className="h-2 bg-zinc-800" />
              </>
            ) : (
              <>
                <div className="text-5xl">✦</div>
                <p className="text-xl font-semibold text-white">Avatar pronto!</p>
                <p className="text-zinc-400 text-sm">
                  Seu Avatar está sendo finalizado. Use-o em qualquer nova composição.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
