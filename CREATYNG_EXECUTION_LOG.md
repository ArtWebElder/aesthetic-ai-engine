# CREATYNG — EXECUTION LOG
# Registro automático de execução dos diffs da FASE 1
# Gerado em: 2026-03-06

---

## STATUS GERAL

| Diff   | Status      | Arquivos criados/modificados |
|--------|-------------|------------------------------|
| PS.0   | ✅ Concluído | `src/types/preset.ts`, `src/data/systemPresets.ts`, `src/lib/presetUtils.ts`, `supabase/migrations/001_preset_system.sql` |
| 9.1    | ✅ Concluído | `src/stores/useWizardStore.ts`, `src/features/editor/wizard/WizardLayout.tsx`, `WizardStep1Subject.tsx`, `WizardStep2Style.tsx`, `WizardStep3Text.tsx`, `index.ts` |
| TR.1   | ✅ Concluído | `public/textures/grunge-metal.png`, `spray-paint.png`, `noise-subtle.png`, `src/features/editor/engine/textureLoader.ts` |
| TR.2   | ✅ Concluído | `src/features/editor/engine/cssVarsInjector.ts` |
| 9.2    | ✅ Concluído | `src/components/PresetCard.tsx`, `src/components/PresetGrid.tsx`, `WizardStep2Style.tsx` (atualizado) |
| TR.3   | ✅ Concluído | `src/components/TextStylePicker.tsx`, `WizardStep3Text.tsx` (atualizado) |
| 9.3    | ✅ Concluído | `src/components/FontSelector.tsx`, `WizardStep3Text.tsx` (atualizado) |
| TR.4   | ✅ Concluído | `src/features/editor/engine/accentWord.ts` |
| 9.4    | ✅ Concluído | `src/features/editor/wizard/PreviewCanvas.tsx`, `WizardStep3Text.tsx` (atualizado) |
| TR.5   | ✅ Concluído | `src/features/editor/engine/textRenderer.ts` |
| TR.6   | ✅ Concluído | `src/features/editor/engine/overlayIntegration.ts` |
| 9.5    | ✅ Concluído | `src/lib/presetSuggestion.ts`, `WizardStep1Subject.tsx` (atualizado) |
| TR.7   | ✅ Concluído | `src/features/editor/engine/exportComposed.ts` |

**Todos os diffs concluídos. `npm run build` passou em 100% dos casos.**

---

## DECISÕES TÉCNICAS E CONFLITOS DOCUMENTADOS

### Conflito: `supabase/functions` excluído do tsconfig
- **Situação:** `VisualDNA` e `SubjectProfile` estão em `supabase/functions/generate-image/types.ts`, mas o tsconfig exclui esse path do build frontend.
- **Solução adotada (conservadora):** Tipos duplicados em `src/types/preset.ts` com comentário de origem. Ambas as definições são compatíveis estruturalmente.
- **Impacto:** Zero — os dois conjuntos de tipos são compatíveis e mantidos em sync manualmente.

### Decisão: Zustand não estava instalado
- **Situação:** `zustand` não estava listado em `package.json`.
- **Ação:** `npm install zustand` executado antes do DIFF 9.1.
- **Impacto:** Build continua passando. `package.json` atualizado.

### Decisão: Texturas geradas programaticamente
- **Situação:** DIFF TR.1 pede texturas PNG tileable (grunge-metal, spray-paint, noise-subtle).
- **Ação:** Geradas via Python com algoritmo determinístico (seed fixo). Não são assets externos.
- **Resultado:** 256×256 PNG, tileable, adequadas para `background-clip: text`.

### Decisão: `background-clip: text` nos mini-canvas do TextStylePicker
- **Situação:** Efeito de textura no texto (`grunge_metal`, `spray_paint`) usa `background-clip: text` em CSS, mas o mini-canvas Canvas 2D não suporta diretamente.
- **Solução adotada:** No `TextStylePicker` (mini-canvas de preview), texturas são simuladas com cor sólida + efeitos de shadow/glow. A textura real é aplicada no export final via CSS quando o componente HTML é rasterizado.
- **Impacto:** Preview aproximado. Export final tem textura real.

### DIFF 9.5 — Modo quick/advanced já parcialmente implementado em 9.1
- **Situação:** Os steps já usavam `mode` do store para mostrar/esconder campos desde o DIFF 9.1.
- **Ação no 9.5:** Completado com `suggestPresetForSubject()`, upload de referência de estilo, framing e ângulo completos no WizardStep1Subject.
- **Dados preservados:** Não há perda de dados ao trocar de modo — campos ficam no store.

---

## CHECKLIST FINAL POR DIFF

### PS.0
- [x] `npm run build` passa sem erros de tipo
- [x] `getPresetById('sys-img-drama')` retorna o preset correto
- [x] `getSuggestedTextPreset('sys-img-drama')` retorna `sys-txt-impact`
- [x] `applyPresetOverride` não muta o objeto original

### 9.1
- [x] `useWizardStore` usa `WizardState` do `src/types/preset.ts`
- [x] Store tem `selectedImagePresetId` e `selectedTextPresetId`
- [x] Store tem `activePresetConfig: PresetConfig`
- [x] `setPresetOverride` usa `applyPresetOverride` (imutável)
- [x] Navegação por teclado (Enter/Esc) implementada

### TR.1
- [x] `loadTexture('grunge_metal')` retorna imagem carregada
- [x] Cache funciona — segunda chamada não recarrega

### TR.2
- [x] `--accent-rgb` no formato correto `R,G,B`

### 9.2
- [x] `PresetCard` recebe `CreatygnPreset` (nunca string)
- [x] Seleção de preset de imagem sugere texto compatível

### TR.3
- [x] 8 cards com preview ao vivo
- [x] Debounce via `useDeferredValue`

### 9.3
- [x] Trocar fonte → `activePresetConfig.text.headlineFont` muda (não estado isolado)
- [x] Fonte só carrega quando seletor abre

### TR.4
- [x] `detectAccentWord('EU QUERIA SER FORTE')` → accent = 'SER FORTE'
- [x] `parseManualAccent('EU [QUERIA] SER FORTE')` → accent = 'QUERIA'

### 9.4
- [x] Canvas atualiza ao digitar headline
- [x] Canvas atualiza ao mudar text preset
- [x] Canvas atualiza ao mudar posição do texto

### TR.5
- [x] Todos os 8 presets renderizando
- [x] Accent word na cor `--accent-word`

### TR.6
- [x] Overlay é gradiente (não retângulo sólido)
- [x] Intensidade muda conforme luminosidade

### 9.5
- [x] Quick Mode mostra só campos essenciais
- [x] Dados não se perdem ao trocar de modo
- [x] Modo persiste em localStorage
- [x] Sugestão automática via subjectProfile

### TR.7
- [x] Export final com texto + imagem compostos
- [x] Resolução alvo respeitada
- [x] Marca d'água opcional

---

## PRÓXIMOS PASSOS (FASE 1 restante)

- **DIFF 13.1-13.5** — Modal de export multi-formato (usa `EXPORT_FORMATS` do TR.7)
- **DIFF 16.1-16.6** — Brand Kit + Avatar (usa `CreatygnPreset` type: `brand_kit`)
- **Integração wizard → motor de geração** — conectar `useWizardStore` ao pipeline de geração existente em `EditorPage.tsx`
- **VF.4-VF.7** — Completar pipeline Vision First (preprocessing, providers, orquestrador)
