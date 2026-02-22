// src/features/editor/templates/types.ts
import type { ProjectSpec } from "@/types/spec";

export type TemplateMeta = {
  id: ProjectSpec["templateId"];
  name: string;
  module: ProjectSpec["module"];
  stylePreset?: ProjectSpec["stylePreset"];
};

export type TemplateRenderProps = {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
};