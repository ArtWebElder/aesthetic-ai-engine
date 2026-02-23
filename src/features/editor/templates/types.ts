// src/features/editor/templates/types.ts
import type { ProjectSpec, TemplateId, ModuleType, StylePreset } from "@/types/spec";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  module: ModuleType;
  stylePreset?: StylePreset;
};

export type TemplateRenderProps = {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
};