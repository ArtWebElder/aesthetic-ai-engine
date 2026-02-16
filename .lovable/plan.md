

# Premium Gradient CTA Button

## What changes

### 1. New `gradient` variant in `button.tsx`
Add a new variant to the button component called `gradient`. This variant will use only Tailwind utility classes and a custom CSS class for the sheen effect. It replaces the current `default` variant as the primary CTA across the app.

The variant classes will set:
- `relative overflow-hidden` (for the sheen pseudo-element)
- White text, font-semibold
- The custom class `btn-gradient` (handles the gradient background + states)

### 2. CSS in `src/index.css` -- new `.btn-gradient` class
All the visual magic lives in pure CSS:

```text
.btn-gradient
  background:        linear-gradient(135deg, accent-orange, primary-green)
  background-size:   200% 200%
  background-position: 0% 50%
  border:            1px solid white/10
  transition:        transform 150ms, filter 150ms, border-color 150ms, background-position 300ms

.btn-gradient:hover
  transform:         translateY(-1.5px)
  filter:            brightness(1.08)
  background-position: 100% 50%   (subtle gradient shift)
  border-color:      white/18

.btn-gradient:active
  transform:         scale(0.98)
  filter:            brightness(0.96)

.btn-gradient::after            (sheen / "reflexo" pseudo-element)
  content: ''
  position: absolute
  inset: 0
  background: linear-gradient(105deg, transparent 40%, white/15 50%, transparent 60%)
  translate: -100% 0
  transition: translate 400ms ease
  pointer-events: none

.btn-gradient:hover::after
  translate: 100% 0             (sheen sweeps across on hover)
```

Colors used (from tokens): `hsl(25 95% 53%)` (accent/orange) and `hsl(155 80% 40%)` (primary/green neon). Only 2 colors -- no rainbow.

### 3. No other buttons change
- `outline`, `ghost`, `secondary`, `link`, `destructive` remain exactly as they are.
- The existing `default` variant stays as a solid green fallback.
- The `gradient` variant is opt-in: used only for the single primary CTA per screen.

## What does NOT happen
- No glow/box-shadow halo
- No infinite gradient animation (movement only on hover)
- No heavy shadows
- No 3+ color gradients
- Sheen sweep is fast and subtle (400ms, low opacity white stripe)

## Technical details

**Files modified:**
1. `src/index.css` -- add `.btn-gradient` class with hover/active/sheen states (~30 lines)
2. `src/components/ui/button.tsx` -- add `gradient` variant string to `buttonVariants`

No new dependencies. No new files. Pure CSS + one variant string.

