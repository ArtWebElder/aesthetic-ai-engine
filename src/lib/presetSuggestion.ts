// src/lib/presetSuggestion.ts
// CREATYNG — MASTER SPEC DIFF 9.5
// Sugestão automática de preset baseada no SubjectProfile do Vision AI.

import type { SubjectProfile } from "@/types/preset";

/**
 * Sugere o ID do image preset mais adequado ao tipo de subject detectado.
 * Usado no Quick Mode após o Vision AI analisar o subject.
 */
export function suggestPresetForSubject(profile: SubjectProfile): string {
  if (profile.subjectType === "person") {
    const crop = profile.framing?.currentCrop ?? "";
    if (crop === "close-up") return "sys-img-drama";
    return "sys-img-editorial";
  }

  if (profile.subjectType === "product") {
    const category = (profile.product?.category ?? "").toLowerCase();
    if (category.includes("food") || category.includes("beverage")) return "sys-img-clean";
    if (category.includes("tech") || category.includes("electronics")) return "sys-img-neon";
    if (category.includes("beauty") || category.includes("luxury")) return "sys-img-clean";
    return "sys-img-clean";
  }

  if (profile.subjectType === "vehicle") return "sys-img-dark";
  if (profile.subjectType === "food") return "sys-img-clean";

  return "sys-img-drama"; // fallback
}
