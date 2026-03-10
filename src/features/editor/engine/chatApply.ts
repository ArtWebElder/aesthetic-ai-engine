// src/features/editor/engine/chatApply.ts
// CREATYNG — Chat Refinement Applier
// Aplica comandos parseados ao RefinementOverrides state.
// Zero IA, zero tokens — tudo local.

import type { ChatCommand } from "./chatParser";

export interface RefinementOverrides {
  headline?: string;
  subheadline?: string;
  cta?: string;
  price?: { value: string; prefix: string; suffix: string };
  whatsapp?: string;
  instagram?: string;
  accentColor?: string;
  fontFamily?: string;
  headlineSizeFactor?: number; // multiplicador: 1.0 = normal, 1.15 = maior
  textPosition?: "top" | "center" | "bottom";
}

export function applyCommand(
  command: ChatCommand,
  currentOverrides: RefinementOverrides
): RefinementOverrides {
  const overrides = { ...currentOverrides };

  switch (command.type) {
    case "change_text":
      switch (command.target) {
        case "headline":
          overrides.headline = command.value;
          break;
        case "subheadline":
          overrides.subheadline = command.value;
          break;
        case "cta":
          overrides.cta = command.value;
          break;
        case "price":
          overrides.price = {
            value: command.value ?? "",
            prefix: overrides.price?.prefix ?? "R$",
            suffix: overrides.price?.suffix ?? "",
          };
          break;
        case "whatsapp":
          overrides.whatsapp = command.value;
          break;
        case "instagram":
          overrides.instagram = command.value;
          break;
      }
      break;

    case "change_color":
      overrides.accentColor = command.value;
      break;

    case "change_size": {
      const current = overrides.headlineSizeFactor ?? 1.0;
      overrides.headlineSizeFactor =
        command.value === "up"
          ? Math.min(current * 1.15, 2.0)
          : Math.max(current * 0.85, 0.5);
      break;
    }

    case "change_position":
      overrides.textPosition = command.value as RefinementOverrides["textPosition"];
      break;

    case "change_font":
      overrides.fontFamily = command.value;
      break;
  }

  return overrides;
}
