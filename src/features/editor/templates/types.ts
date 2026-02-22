// src/features/editor/templates/types.ts
import type { ProjectSpec } from "@/types/spec";

export type TemplateId =
  | "photo_01"
  | "photo_02"
  | "photo_03"
  | "photo_04"
  | "photo_05";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  module: ProjectSpec["module"];
  stylePreset?: ProjectSpec["stylePreset"];
};

export type TemplateRenderProps = {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
};