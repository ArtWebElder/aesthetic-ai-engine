## Visual Refinement Plan: Creatyng Brand System

This plan addresses the complete visual rebranding from "Magic Idea" to "Creatyng" — a premium creative direction tool with contemporary editorial SaaS aesthetics. It also fixes the existing build errors (which are type-related but will be resolved with minimal, non-logic changes).

---

### Phase 1: Fix Build Errors (prerequisite)

These are small type/import fixes — no logic changes:

1. `**src/features/auth/fake-auth.tsx**` — Add `name` to the `User` type: `{ email: string; name?: string }`
2. `**src/lib/mocks/data.ts**` — Remove `Project` import from `@/types` (it doesn't exist there), import from `@/types/spec` instead, or remove the mock projects that use the old type
3. `**src/main.tsx**` — Remove `.tsx` extension from `App` import
4. `**src/pages/ProjectEditor.tsx**` — Fix import path for `CanvasPreview`
5. `**src/features/auth/projects/ProjectsPage.tsx**` and `**src/features/projects/ProjectsPage.tsx**` — Fix missing `useProjects` import (likely dead files that reference a non-existent module)

---

### Phase 2: Color System & Typography

`**src/index.css**` — Replace entire color token system:

Dark theme (default):

- `--background`: `#121315`
- `--foreground` / primary text: `#F3F3F1`
- `--card` / surface: `#1B1D21`
- `--popover` / elevated: `#24272D`
- `--border`: `#2E3238`
- `--primary`: `#FF6A3D` (warm orange accent)
- `--secondary` (blue accent mapped to `--ring` or utility): `#3A7BFF`
- `--muted-foreground`: `#A9ADB3`
- Remove green neon (`hsl(155...)`) entirely

Light theme:

- `--background`: `#F4F3EF`
- `--card` / surface: `#FBFAF7`
- `--border`: `#E7E3DB`
- `--primary`: `#E4572E`
- `--foreground`: `#1C1C1C`

Typography:

- Headlines font: **Gosh** (weight 600–700, tight tracking)
- Body font: **Instrument Sans** (weight 400–500)
- UI labels: Instrument Sans 500

Google Fonts link in `**index.html**` — add `Gosh` and `Instrument Sans` font imports.

`**tailwind.config.ts**` — Update `fontFamily` to `Gosh` and `Instrument Sans`.

---

### Phase 3: Remove Old Brand Elements

1. **Aurora Divider** — Replace with a simple, subtle `border-b border-border` or a very soft single-color divider (no rainbow gradient). Update `src/index.css` aurora-divider styles.
2. **Noise overlay** — Remove or reduce to barely perceptible. The `noise-overlay::before` pseudo-element should be removed or opacity reduced to `0.01`.
3. `**btn-gradient**` — Remove the orange-to-green gradient CTA button. Replace with solid `--primary` (`#FF6A3D`) button with subtle hover darkening.
4. **Glassmorphism** — Keep `glass-surface` only for modals/dialogs/floating panels. Remove from stat cards, project list items, FAQ items, and regular content cards. Replace with solid `bg-card` surfaces.
5. `**hover-lift**` — Keep but remove the green glow (`hsl(var(--primary) / 0.08)` shadow). Use neutral shadow only.
6. **Sparkles icon** — Replace everywhere with a simple wordmark "C" or a minimal geometric logo. No sparkle/AI icons.

---

### Phase 4: Component-Level Updates

`**src/components/SidebarNav.tsx**`

- Replace "Magic Idea" text with "Creatyng"
- Replace Sparkles icon with a simple "C" lettermark in a rounded square
- Update sidebar bg to use `#121315` tones
- Nav items: clean hover states, no glow

`**src/components/Topbar.tsx**`

- Clean search bar styling with `bg-card` instead of `bg-secondary/50`
- Credits indicator: use muted styling, no green coin icon
- Language selector: refined styling

`**src/pages/Login.tsx**`

- Replace "Magic Idea" branding with "Creatyng"
- Remove Sparkles icon, use text wordmark
- Replace aurora divider with simple separator
- Login card: solid `bg-card` with subtle border (glassmorphism OK here since it's a floating panel)
- Button: solid primary color, no gradient

`**src/pages/Dashboard.tsx**`

- Stat cards: `bg-card` with `border border-border`, no glass effect
- Quick create cards: solid surface, subtle border, clean hover
- Recent projects: solid surface rows

`**src/components/StatCard.tsx**`

- Replace `glass-surface` with `bg-card border border-border`
- Icon color: `text-muted-foreground` (no green)

`**src/components/CreateProjectModal.tsx**`

- Glass OK here (it's a modal)
- Update title font

`**src/pages/Billing.tsx**`, `**src/pages/Help.tsx**`, `**src/pages/Settings.tsx**`, `**src/pages/Projects.tsx**`

- Replace `glass-surface` on content cards with solid `bg-card border border-border`
- Clean typography with new font classes

`**src/components/editor/EditorInspector.tsx**`

- Tab system: refined, clean active states with bottom border in `--primary` color
- Replace glass surfaces with solid card backgrounds

`**src/components/ThemeToggle.tsx**`

- Remove glass-surface from dropdown

`**src/components/CommandBar.tsx**`

- Clean styling, no glow effects

---

### Phase 5: Motion & Micro-interactions

`**src/index.css**` — Update keyframes:

- `fade-in`: 150ms ease-out (snappier)
- `slide-up`: 200ms ease-out
- Modal animation: 250ms fade + scale(0.98 → 1)
- Remove shimmer animation or make it very subtle

`**tailwind.config.ts**` — Update animation durations accordingly.

---

### Phase 6: Canvas/Template Token System

`**src/styles/magic-tokens.css**` — Update default tokens to match new brand colors (orange accent instead of green).

`**src/features/editor/style-resolver.ts**` and `**src/features/editor/design/resolveTokens.ts**` — Update default accent color from `#34d399` (green) to `#FF6A3D` (orange). This is purely the default visual token value, not logic.

---

### Technical Details

**Files to modify (approximately 20 files):**


| File                                          | Change Type                                                   |
| --------------------------------------------- | ------------------------------------------------------------- |
| `index.html`                                  | Add Gosh + Instrument Sans font links                         |
| `src/index.css`                               | Full color token rewrite, remove aurora/gradient/noise styles |
| `tailwind.config.ts`                          | Font families, remove green-based color refs                  |
| `src/styles/magic-tokens.css`                 | Update default accent token                                   |
| `src/features/auth/fake-auth.tsx`             | Add `name?: string` to User type                              |
| `src/lib/mocks/data.ts`                       | Fix import                                                    |
| `src/main.tsx`                                | Fix import extension                                          |
| `src/components/SidebarNav.tsx`               | Rebrand, restyle                                              |
| `src/components/Topbar.tsx`                   | Restyle, fix `user.name`                                      |
| `src/components/AuroraDivider.tsx`            | Simplify to subtle divider                                    |
| `src/components/StatCard.tsx`                 | Remove glass, use solid card                                  |
| `src/components/ThemeToggle.tsx`              | Remove glass from dropdown                                    |
| `src/pages/Login.tsx`                         | Rebrand to Creatyng                                           |
| `src/pages/Dashboard.tsx`                     | Restyle cards                                                 |
| `src/pages/Billing.tsx`                       | Restyle surfaces                                              |
| `src/pages/Help.tsx`                          | Restyle surfaces                                              |
| `src/pages/Settings.tsx`                      | Restyle, fix user.name                                        |
| `src/pages/Projects.tsx`                      | Restyle surfaces                                              |
| `src/components/editor/EditorInspector.tsx`   | Restyle tabs/surfaces                                         |
| `src/components/CreateProjectModal.tsx`       | Update title font                                             |
| `src/features/editor/style-resolver.ts`       | Default accent color                                          |
| `src/features/editor/design/resolveTokens.ts` | Default accent color                                          |


**Font note:** "Gosh" is a commercial/less-common font. If unavailable on Google Fonts, will use a similar geometric display font (e.g., "Outfit" or "General Sans" via Fontsource) as fallback, maintaining the same weight and tracking characteristics specified.

**No changes to:**

- Routing, data structures, types (beyond the `name` field fix)
- Prompt compilation, template registry, engine logic
- Store/state management, i18n keys structure
- Feature behavior, API integrations

**Execute in 2 STEPS**  
  
**STEP A**:

- Phase 1 (fix build errors)
- Phase 2 (color + font system)

Rund, build, test

After:

### STEP B:

- Phase 3, 4, 5, 6

## 🔐 STRICT RULES

- Do NOT modify business logic
- Do NOT modify feature modules
- Do NOT change state management
- Do NOT alter prompt compilation logic
- Do NOT change template registry
- Only visual, styling, and typography adjustments
- If any file requires structural modification, explain before applying