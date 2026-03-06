// src/features/editor/wizard/WizardStep1Subject.tsx
// CREATYNG — MASTER SPEC DIFF 9.1 (shell)
// Conteúdo preenchido em diffs posteriores (9.5 para quick/advanced).

import { useWizardStore } from "@/stores/useWizardStore";

export function WizardStep1Subject() {
  const { mode, subjectThumbnail, setSubject, framing, cameraAngle } = useWizardStore();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string) ?? "";
      setSubject(base64, base64); // thumbnail = original por enquanto
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 1 — Sujeito</h2>
        <p className="text-muted-foreground text-sm">
          Envie a foto do sujeito (pessoa, produto ou marca) que será gerado.
        </p>
      </div>

      {/* Upload */}
      <label className="flex flex-col items-center justify-center w-full aspect-square max-h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden relative bg-muted/30">
        {subjectThumbnail ? (
          <img src={subjectThumbnail} alt="Subject" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-4xl">📷</span>
            <span className="text-sm font-medium">Clique para enviar</span>
            <span className="text-xs">PNG, JPG ou WEBP</span>
          </div>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
      </label>

      {/* Campos avançados — visíveis só no modo advanced */}
      {mode === "advanced" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Enquadramento</label>
            <div className="flex gap-2 flex-wrap">
              {(["face", "half_body", "full_body", "product"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => useWizardStore.getState().setPresetOverride("composition.subjectPosition", v)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    framing === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {v.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ângulo da câmera</label>
            <div className="flex gap-2 flex-wrap">
              {(["eye_level", "low_angle", "high_angle"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => useWizardStore.getState().setPresetOverride("composition.cameraAngle", v)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    cameraAngle === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {v.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
