// src/config/featureFlags.ts
// Feature flags por feature do Creatyng
// Permite ativar/desativar funcionalidades por feature sem deletar codigo
// NUNCA delete codigo — apenas desative via flag

export interface FeatureConfig {
  chatEnabled: boolean;
  refinePageEnabled: boolean;
  exportResizeEnabled: boolean;
  zoomInResult: boolean;
  maxChatMessages: number;
  creditsPerGeneration: number;
}

export const FEATURE_FLAGS: Record<string, FeatureConfig> = {
  'clone-criativo': {
    chatEnabled: false,           // DESATIVADO — reativar quando chat funcionar bem
    refinePageEnabled: false,     // DESATIVADO — sem chat, nao faz sentido
    exportResizeEnabled: true,
    zoomInResult: true,
    maxChatMessages: 9,
    creditsPerGeneration: 12,
  },
  // Features futuras:
  // 'carrossel': { chatEnabled: true, refinePageEnabled: true, ... },
};

export function getFeatureFlags(feature: string = 'clone-criativo'): FeatureConfig {
  return FEATURE_FLAGS[feature] || FEATURE_FLAGS['clone-criativo'];
}
