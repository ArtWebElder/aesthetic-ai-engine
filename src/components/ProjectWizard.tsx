import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, ShoppingBag, Camera, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { createProject, upsertProject } from "@/features/projects/store";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ProjectFormat, StylePreset } from "@/types/spec";
import type { ProjectType } from "@/types";
import { FORMAT_OPTIONS, STYLE_PRESETS } from "@/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: ProjectType;
}

const TYPE_OPTIONS: { type: ProjectType; labelKey: string; icon: typeof ImagePlus; descKey: string }[] = [
  { type: "social_post", labelKey: "project_type.social_post", icon: ImagePlus, descKey: "dashboard.quick_create_social_hint" },
  { type: "ecom_banner", labelKey: "project_type.ecom_banner", icon: ShoppingBag, descKey: "dashboard.quick_create_ecom_hint" },
  { type: "photoshoot", labelKey: "project_type.photoshoot", icon: Camera, descKey: "dashboard.quick_create_photoshoot_hint" },
];

const STEPS = ["type", "format", "finish"] as const;
type Step = typeof STEPS[number];

const ProjectWizard = ({ open, onOpenChange, initialType }: ProjectWizardProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("type");
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>(initialType ?? "social_post");
  const [format, setFormat] = useState<ProjectFormat | "">("");
  const [style, setStyle] = useState<StylePreset>("minimal_clean");

  const formats = useMemo(() => FORMAT_OPTIONS[type] || [], [type]);
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (!open) return;
    setStep(initialType ? "format" : "type");
    if (initialType) setType(initialType);
    setName("");
    setFormat("");
    setStyle("minimal_clean");
  }, [open, initialType]);

  useEffect(() => {
    const first = (formats[0]?.value ?? "") as ProjectFormat | "";
    setFormat(first);
  }, [formats]);

  const handleCreate = () => {
    const safeName = (name || "").trim() || t("common.untitled_project");
    if (!format) return;

    const p = createProject(safeName, format);
    const next = {
      ...p,
      name: safeName,
      spec: { ...p.spec, stylePreset: style },
    };
    upsertProject(next);

    onOpenChange(false);
    navigate(`/app/projects/${next.id}`);
  };

  const canNext = step === "type" ? !!type : step === "format" ? !!format : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-surface-strong sm:max-w-lg p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-heading font-semibold">{t("projects.new_project")}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {step === "type" && t("create_project.type")}
              {step === "format" && t("create_project.format")}
              {step === "finish" && t("create_project.name")}
            </p>
          </div>

          {/* Step: Type */}
          {step === "type" && (
            <div className="grid gap-3 animate-fade-in">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setType(opt.type)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150",
                    type === opt.type
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150",
                    type === opt.type ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <opt.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t(opt.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t(opt.descKey)}</p>
                  </div>
                  {type === opt.type && (
                    <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step: Format */}
          {step === "format" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value as ProjectFormat)}
                    className={cn(
                      "p-3 rounded-xl border text-left text-sm transition-all duration-150",
                      format === f.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <p className="font-medium">{f.label}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">{t("create_project.style_preset")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left text-sm transition-all duration-150",
                        style === s.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Finish */}
          {step === "finish" && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>{t("create_project.name")}</Label>
                <Input
                  placeholder={t("create_project.name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("create_project.type")}</span>
                  <span className="font-medium">{t(`project_type.${type}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("create_project.format")}</span>
                  <span className="font-medium">{formats.find(f => f.value === format)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("create_project.style_preset")}</span>
                  <span className="font-medium">{STYLE_PRESETS.find(s => s.value === style)?.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (stepIndex === 0) onOpenChange(false);
                else setStep(STEPS[stepIndex - 1]);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {stepIndex === 0 ? t("common.close") : t("common.back")}
            </Button>

            {step === "finish" ? (
              <Button onClick={handleCreate} disabled={!format} size="sm">
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t("create_project.create_button")}
              </Button>
            ) : (
              <Button onClick={() => setStep(STEPS[stepIndex + 1])} disabled={!canNext} size="sm">
                {t("common.next")}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectWizard;
