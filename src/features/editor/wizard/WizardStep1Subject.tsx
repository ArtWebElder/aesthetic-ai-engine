// src/features/editor/wizard/WizardStep1Subject.tsx
// CREATYNG — MASTER SPEC DIFF 9.5 (quick/advanced completo + sugestão automática)
// DIFF 16.5: opção "Usar Avatar" se usuário tem avatar criado

import { useEffect } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { suggestPresetForSubject } from "@/lib/presetSuggestion";
import { FEATURES } from "@/lib/featureFlags";
import { preprocessSubject } from "@/lib/preprocessSubject";

const FRAMING_OPTIONS = [
  { value: "face" as const, label: "Rosto" },
  { value: "half_body" as const, label: "Meio corpo" },
  { value: "full_body" as const, label: "Corpo inteiro" },
  { value: "product" as const, label: "Produto" },
];

const ANGLE_OPTIONS = [
  { value: "eye_level" as const, label: "Nível dos olhos" },
  { value: "low_angle" as const, label: "Ângulo baixo" },
  { value: "high_angle" as const, label: "Ângulo alto" },
];

export function WizardStep1Subject() {
  const { mode, subjectThumbnail, subjectProfile, setSubject, framing, cameraAngle, selectImagePreset } =
    useWizardStore();

  // DIFF 16.5: avatar do brand kit ativo
  const { getActiveKit } = useBrandKitStore();
  const activeKit = getActiveKit();
  const avatar = activeKit?.avatar;

  // Sugestão automática de preset quando o subjectProfile estiver disponível
  useEffect(() => {
    if (!subjectProfile) return;
    const suggestedId = suggestPresetForSubject(subjectProfile);
    selectImagePreset(suggestedId);
  }, [subjectProfile]);

  // DIFF 16.5: usar avatar como subject
  function handleUseAvatar() {
    if (!avatar?.bestReference) return;
    setSubject(avatar.bestReference, avatar.bestReference);
    // Strict Identity ON automático — já é o padrão no pipeline
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string) ?? "";
      preprocessSubject(raw)
        .then((result) => setSubject(result.dataUrl, result.dataUrl))
        .catch(() => setSubject(raw, raw));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 1 — Sujeito</h2>
        <p className="text-muted-foreground text-sm">
          {mode === "quick"
            ? "Envie a foto do sujeito. O estilo será sugerido automaticamente."
            : "Envie a foto e configure enquadramento e ângulo."}
        </p>
      </div>

      {/* DIFF 16.5 — Opção de usar Avatar se disponível (feature flag VITE_FEATURE_AVATAR) */}
      {FEATURES.AVATAR && avatar?.bestReference && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-800 bg-purple-950/30">
          <img
            src={avatar.bestReference}
            alt={avatar.name}
            className="w-12 h-12 rounded-lg object-cover border-2 border-purple-600"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Usar meu Avatar</p>
            <p className="text-xs text-zinc-400">{avatar.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseAvatar}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                subjectThumbnail === avatar.bestReference
                  ? "bg-purple-600 text-white"
                  : "border border-purple-700 text-purple-400 hover:bg-purple-600 hover:text-white"
              }`}
            >
              {subjectThumbnail === avatar.bestReference ? "✓ Usando" : "Usar"}
            </button>
          </div>
        </div>
      )}

      {/* Upload */}
      <label className="flex flex-col items-center justify-center w-full aspect-square max-h-72 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden relative bg-muted/30">
        {subjectThumbnail ? (
          <img src={subjectThumbnail} alt="Subject" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
            <span className="text-5xl">📷</span>
            <span className="text-sm font-medium">Clique para enviar</span>
            <span className="text-xs">PNG, JPG ou WEBP</span>
          </div>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
      </label>

      {/* Modo quick: mostra apenas indicador se há subject */}
      {mode === "quick" && subjectThumbnail && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-green-500">✓</span>
          Sujeito carregado. Próximo passo: escolher estilo.
          {subjectProfile && (
            <span className="ml-1 text-xs opacity-60">
              (preset sugerido automaticamente)
            </span>
          )}
        </div>
      )}

      {/* Modo advanced: framing + ângulo */}
      {mode === "advanced" && (
        <div className="flex flex-col gap-5 pt-2 border-t border-border">
          <div>
            <label className="text-sm font-medium mb-2 block">Enquadramento</label>
            <div className="flex gap-2 flex-wrap">
              {FRAMING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => useWizardStore.setState({ framing: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    framing === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ângulo da câmera</label>
            <div className="flex gap-2 flex-wrap">
              {ANGLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => useWizardStore.setState({ cameraAngle: opt.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    cameraAngle === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload de referência de estilo — advanced only */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Referência de estilo{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary transition-colors">
              <span className="text-2xl">🖼</span>
              <div>
                <p className="text-sm">Enviar imagem de referência</p>
                <p className="text-xs text-muted-foreground">O estilo será extraído automaticamente</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    useWizardStore.getState().setReference((ev.target?.result as string) ?? "");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
