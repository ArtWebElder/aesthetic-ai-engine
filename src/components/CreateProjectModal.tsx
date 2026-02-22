import { createProject, upsertProject } from "../features/projects/store"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { createProject } from "../features/projects/store"
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
  const [format, setFormat] = useState("");
  const [style, setStyle] = useState("");

  const formats = FORMAT_OPTIONS[type] || [];

  const handleCreate = () => {
  const safeName = (name || "").trim() || "Untitled Project";
  if (!format) return;

  const p = createProject(safeName, format as ProjectFormat);

  // ✅ grava o type/style que você escolheu no modal
  const next = {
    ...p,
    name: safeName,
    spec: {
      ...p.spec,
      module: type,                 // <-- conecta o Type
      format: format as any,         // já vem, mas mantém
      stylePreset: style || p.spec.stylePreset, // <-- conecta o Style
    },
  };

  upsertProject(next);

  onOpenChange(false);
  setName("");
  setFormat("");
  setStyle("");

  navigate(`/app/projects/${next.id}`);
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                setFormat("");
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