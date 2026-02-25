

## Problem

The filter dropdown uses values `"banner"`, `"thumbnail"`, `"photo"` but the actual `project.spec.module` values are `"social_post"`, `"ecom_banner"`, `"photoshoot"`. They never match, so filtering does nothing.

The search by name already works correctly (line 36) — it just needs the filter values aligned.

## Plan

**File: `src/pages/Projects.tsx`** (lines 80-85)

Replace the `SelectItem` values to match the real `ModuleType` union (`"social_post" | "ecom_banner" | "photoshoot"`), and update the labels to the user's requested names:

| Current value | New value | Label |
|---|---|---|
| `"banner"` | `"ecom_banner"` | Banner Ad |
| `"thumbnail"` | `"social_post"` | Social Post |
| `"photo"` | `"photoshoot"` | Photoshoot |

Remove the i18n keys for these since they map to wrong concepts, and use direct strings (or add correct i18n keys). The `"all"` option stays as-is.

No logic changes — only fixing the `value` props on `SelectItem` so the existing `p.spec?.module !== typeFilter` comparison works.

