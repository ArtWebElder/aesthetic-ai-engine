# CREATYNG — Sistema de Tema (design tokens)

> Objetivo: trocar o visual da plataforma inteira mexendo em **um lugar só**.
> Quando a "Claude Design" entregar a paleta nova, a gente mapeia os tokens aqui e pronto.

## Onde ficam os tokens
- **`src/index.css`** → blocos `:root` (claro) e `.dark` (escuro). É a **fonte da verdade**.
- **`tailwind.config.ts`** → expõe os tokens como classes utilitárias.
- Modo claro/escuro: `next-themes` (toggle em Configurações) alterna a classe `.dark`.

## Tokens disponíveis
Cores (HSL triplet, pra suportar opacidade `hsl(var(--x) / 0.3)`):
`--background --foreground --card --popover --primary --secondary --muted --accent --destructive --border --input --ring` + `--sidebar-*`.

**Marca (novo — controla o laranja em todo o app):**
- `--brand` (= #ff713d) · `--brand-2` (= #FF9B70) · `--brand-foreground`
- `--brand-gradient` → `linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)))`
- `--shadow-brand` → sombra/glow laranja
- `--shadow-sm / --shadow-md / --shadow-lg` → escala de sombra neutra
- `--radius` → raio base

## Como usar (convenção — NÃO cravar hex novo)
- Inline style: `color: 'hsl(var(--brand))'`, `background: 'hsl(var(--brand) / 0.1)'`, `background: 'var(--brand-gradient)'`, `boxShadow: 'var(--shadow-brand)'`.
- Tailwind: `text-brand bg-brand border-brand`, `bg-brand-gradient`, `shadow-brand`, `shadow-soft-md`, `text-creatyng-accent`.

## Como re-skin (trocar a marca toda)
1. Edite `--brand` / `--brand-2` (e gradiente/sombra se quiser) em `src/index.css` (`:root` e `.dark`).
2. Pronto — os ~333 usos tokenizados mudam juntos.
3. **Também troque os hex nos "dados de cor"** abaixo (ver exceção).

## ⚠️ Exceção: cores de dados concatenadas com alpha
Alguns lugares montam cor + alpha em hex (`` `${color}25` ``), o que **exige hex** (não aceita `hsl(var())`). Esses ficam propositalmente em hex e devem ser trocados à mão num rebrand:
- `src/app/create/studio/types.ts` → `NODE_TYPE_DEFS[].color`, `PRESET_FLOWS[].color`
- `src/app/create/studio/flowStyles.ts` → `color` dos estilos
- `src/pages/Projects.tsx` → `PROJECT_COLORS`
- `src/pages/RefinementPage.tsx` → `QUICK_ACTION_COLORS`
- `src/pages/admin/AdminNotifications.tsx` → `TYPE_CONFIG.billing.color`
- `src/components/NotificationCenter.tsx` → mapa de cores (`credit`/`billing`)
- `src/pages/OnboardingPage.tsx` → `PROFILES[].color` (business)
> Migração futura possível: trocar `${color}25` por `color-mix(in srgb, var(--brand) 15%, transparent)` pra tokenizar 100%.

## O que enviar da "Claude Design" (pra implementar fácil)
Pra re-skin global, **tokens + specs de componente** (não 1 HTML por página):
- Paleta (hex) de fundo/superfícies/texto/borda/**marca + estados** (hover/active/disabled)
- Degradês, escala de sombra (valores), radius, tipografia (fontes/tamanhos/pesos)
- Specs: botão (variantes/estados), input, card, **toast**, badge
Formato ideal: **tabela de tokens / CSS variables / JSON** → mapeio direto nos vars acima.
HTML por página só é necessário se a mudança também altera **layout/estrutura** de telas específicas.
