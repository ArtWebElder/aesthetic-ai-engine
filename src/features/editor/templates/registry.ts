// src/features/editor/templates/registry.ts
import type { TemplateId, TemplateMeta } from "./types";

// catálogo (usado no painel da esquerda e no renderer)
export const TEMPLATE_CATALOG: TemplateMeta[] = [
  { id: "photo_01", name: "Bold Typography", module: "photoshoot", stylePreset: "bold_ads" },
  { id: "photo_02", name: "Product Spotlight", module: "photoshoot", stylePreset: "minimal_clean" },
  { id: "photo_03", name: "Gradient Overlay", module: "photoshoot", stylePreset: "glass" },
  { id: "photo_04", name: "Minimal Card", module: "photoshoot", stylePreset: "minimal_clean" },
  { id: "photo_05", name: "Story Impact", module: "photoshoot", stylePreset: "bold_ads" },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "photo_01";