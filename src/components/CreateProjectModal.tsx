import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createProject, upsertProject } from "@/features/projects/store";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ProjectFormat, StylePreset } from "@/types/spec";
import type { ProjectType } from "@/types";
import { FORMAT_OPTIONS, STYLE_PRESETS, PROJECT_TYPE_LABELS } from "@/types";
import { useI18n } from "@/i18n";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectModal = ({ open, onOpenChange }: CreateProjectModalProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("social_post");
  const [format, setFormat] = useState<ProjectFormat | "">("");
  const [style, setStyle] = useState<StylePreset | "">("");

  const formats = useMemo(() => FORMAT_OPTIONS[type] || [], [type]);

  useEffect(() => {
    if (!open) return;

    const first = (formats[0]?.value ?? "") as ProjectFormat | "";
    const stillValid = !!formats.find((f) => f.value === format);

    if (!format || !stillValid) setFormat(first);
    if (!style) setStyle((STYLE_PRESETS[0]?.value ?? "") as StylePreset | "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, formats]);

  const handleCreate = () => {
    const safeName = (name || "").trim() || "Untitled Project";
    if (!format) return;

    const p = createProject(safeName, format);

    const next = {
      ...p,
      name: safeName,
      spec: {
        ...p.spec,
        stylePreset: (style || p.spec.stylePreset) as StylePreset,
      },
    };

    upsertProject(next);

    onOpenChange(false);
    setName("");
    setStyle("");

    // ✅ rota EXISTE no App.tsx
    navigate(`/app/projects/${next.id}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setName("");
          setStyle("");
        }
      }}
    >
      <DialogContent className="glass-surface-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("projects.new_project")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("create_project.name")}</Label>
            <Input
              placeholder={t("create_project.name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("create_project.type")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((projectType) => (
                  <SelectItem key={projectType} value={projectType}>
                    {t(`project_type.${projectType}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("create_project.format")}</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ProjectFormat)}>
              <SelectTrigger>
                <SelectValue placeholder={t("create_project.select_format")} />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("create_project.style_preset")}</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as StylePreset)}>
              <SelectTrigger>
                <SelectValue placeholder={t("create_project.select_style")} />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" onClick={handleCreate} className="w-full mt-2" disabled={!format}>
            {t("create_project.create_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
