We are not refining spacing.

We are redesigning the editor experience.

This is Editor V2 — Creative Workspace Mode.

STRICT RULE:

Do NOT modify business logic.

Do NOT modify compilePrompt.

Do NOT modify engine.

Do NOT modify state/store.

Do NOT modify routing.

Do NOT rename files.

Do NOT introduce new dependencies.

Visual architecture only.

------------------------------------------------

OBJECTIVE

------------------------------------------------

Transform the editor from a 3-column dashboard into a creative studio interface.

Canvas must feel dominant.

Inspector must feel like a property panel.

Templates must feel like a collapsible library.

------------------------------------------------

PHASE 1 — NEW LAYOUT STRUCTURE

------------------------------------------------

1. Grid:

Current:

lg:grid-cols-[320px_1fr_420px]

New:

lg:grid-cols-[240px_1fr_360px]

2. Make left template column collapsible.

Add small collapse button at top.

Collapsed width: 60px.

Expanded width: 240px.

No logic change — purely visual toggle using local state in EditorPage.

3. Canvas:

Remove top title bar completely.

Canvas container:

- rounded-2xl

- subtle shadow

- more vertical breathing room

- centered with max-w constraint

- feels like a stage

Add subtle stage background wrapper behind canvas.

------------------------------------------------

PHASE 2 — INSPECTOR RESTRUCTURE

------------------------------------------------

Inspector should no longer feel like a form stack.

Group into collapsible sections:

- Subject

- Scene

- Layout

- Content

- Export

Each section:

- Uppercase muted title

- Chevron expand/collapse

- Smooth 150ms animation

- Default: first 2 open, others collapsed

Remove dense vertical stacking.

Implement real visual grouping.

------------------------------------------------

PHASE 3 — VISUAL HIERARCHY

------------------------------------------------

Top header:

Remove backdrop blur.

Use solid surface.

Make badges smaller and muted.

Primary button (Generate Base Image) visually stronger.

Bottom action bar:

Make solid.

Reduce opacity tricks.

Clean border-top.

------------------------------------------------

PHASE 4 — MICRO INTERACTIONS

------------------------------------------------

Add:

- Fade+slide for tab switches.

- Soft hover elevation on template cards.

- Collapse/expand smooth height animation.

- Primary button hover: slight brightness increase.

Remove:

- Any glow

- Any neon

- Any shimmer

- Any heavy shadow

------------------------------------------------

PHASE 5 — CREATIVE STUDIO MODE

------------------------------------------------

Canvas must visually dominate.

Reduce visual weight of:

- Inspector borders

- Template cards

- Input fields

Increase visual focus on:

- Canvas

- Primary CTA

- Section headers

------------------------------------------------

SPACING SYSTEM

------------------------------------------------

Use strict 8px grid.

Section separation: 24px.

Major block separation: 32px.

Field spacing: 12px.

------------------------------------------------

FINAL RESULT SHOULD FEEL LIKE

------------------------------------------------

Notion + Mocha + Linear-level minimal SaaS.

A creative tool.

Not a settings dashboard.

Explain changes before applying.