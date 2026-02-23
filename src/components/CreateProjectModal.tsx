import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createProject, upsertProject } from "@/features/projects/store";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ProjectFormat } from "@/types/spec";
import {
  ProjectType,
  FORMAT_OPTIONS,
  STYLE_PRESETS,
  PROJECT_TYPE_LABELS,
} from "@/types";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectModal = ({ open, onOpenChange }: CreateProjectModalProps) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("social_post");
  const [format, setFormat] = useState<string>("");
  const [style, setStyle] = useState<string>("");

  const formats = useMemo(() => FORMAT_OPTIONS[type] || [], [type]);

  // ✅ sempre que abrir modal ou trocar type, garante um format válido
  useEffect(() => {
    if (!open) return;

    const first = formats[0]?.value ?? "";
    // se o format atual não existe mais nessa lista, reseta pro primeiro
    const stillValid = !!formats.find((f) => f.value === format);

    if (!format || !stillValid) setFormat(first);

    // style default (se vazio)
    if (!style) setStyle(STYLE_PRESETS[0]?.value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, formats]);

  const handleCreate = () => {
    const safeName = (name || "").trim() || "Untitled Project";
    if (!format) return;

    // ✅ createProject já cria o spec completo baseado no format
    const p = createProject(safeName, format as ProjectFormat);

    // ✅ só aplica stylePreset se você escolheu algo
    const next = {
      ...p,
      name: safeName,
      spec: {
        ...p.spec,
        stylePreset: (style || p.spec.stylePreset) as any,
      },
    };

    upsertProject(next);

    // reset UI
    onOpenChange(false);
    setName("");
    setStyle("");
    // não precisa setFormat("") porque ele vai ser re-selecionado pelo useEffect ao abrir

    // ✅ vai direto pro editor/canvas
    navigate(`/app/editor/${next.id}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          // quando fecha, limpa só o que faz sentido
          setName("");
          setStyle("");
        }
      }}
    >
      <DialogContent className="glass-surface-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Summer Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as ProjectType);
                // NÃO zera format aqui; o useEffect vai setar o primeiro válido
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROJECT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
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
            <Label>Style Preset</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
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

          <Button
            type="button"
            onClick={handleCreate}
            className="w-full mt-2"
            disabled={!format}
          >
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;