// src/lib/creditCosts.ts
// CREATYNG — Credit cost definitions

export const CREDIT_COSTS: Record<string, number> = {
  'clone-criativo': 12,
  'food-pop-generation': 5,
  'pop-design-generation': 8,
  'chat-ai-edit': 1,
  'export-multi-format': 0,
  'text-edit': 0,
  'styled-photo': 5,
  'creative-banner': 8,
  'simple-gen': 3,
};

export function calculateCost(action: string): number {
  return CREDIT_COSTS[action] ?? 5;
}

export function hasEnoughCredits(balance: number, action: string): boolean {
  return balance >= calculateCost(action);
}
