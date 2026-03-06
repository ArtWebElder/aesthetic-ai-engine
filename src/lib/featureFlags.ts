// src/lib/featureFlags.ts
// CREATYNG — PRE.1 Feature flags centralizados
// Adicionar VITE_FEATURE_* no .env para ativar features em desenvolvimento.
// Por padrão todas as features beta ficam desativadas.

export const FEATURES = {
  /**
   * Avatar — criação de avatar via Brand Kit e uso no wizard.
   * Desativado por padrão até o pipeline de geração estar conectado.
   * Ativar: VITE_FEATURE_AVATAR=true no .env
   */
  AVATAR: import.meta.env.VITE_FEATURE_AVATAR === "true",
} as const;
