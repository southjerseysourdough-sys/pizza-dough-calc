# Component inventory

Updated for the recipe-lifecycle continuation on 2026-08-03. Registry URLs are configured in `components.json`; the lifecycle work preserves the Linear redesign and its calculation engine.

## Recipe lifecycle additions

| Capability                 | Component or library   | Version / source | Local use                                                                                               |
| -------------------------- | ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| Pizza preview choreography | Native animation frame | Browser API      | Reversible 30-frame reference-bake sequence with no canvas, WebGL, or autoplay dependency               |
| Formula Signature drawing  | Anime.js               | `4.5.0`          | One-shot drawable paths for the live signature; saved, print, and PDF signatures remain static          |
| Print workflow             | react-to-print         | `3.3.0`          | Prints a dedicated semantic, white-paper recipe sheet instead of the application chrome                 |
| PDF workflow               | `@react-pdf/renderer`  | `4.5.1`          | Dynamically imported selectable-text PDF with vector signature and pagination                           |
| Browser verification       | Playwright             | `1.62.1`         | Chromium lifecycle, persistence, sharing, artifacts, manifest, theme, reduced-motion, and mobile checks |

### New shadcn / Base UI primitives

| Primitive     | Exact installed command                                    | Local path                            | Use                                                                          |
| ------------- | ---------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Dialog        | `corepack pnpm exec shadcn add dialog dropdown-menu --yes` | `src/components/ui/dialog.tsx`        | Naming, Saved Recipes, confirmations, clipboard fallback, and import preview |
| Dropdown menu | `corepack pnpm exec shadcn add dialog dropdown-menu --yes` | `src/components/ui/dropdown-menu.tsx` | Secondary recipe actions with keyboard navigation and managed focus          |

The existing Button source was retained when the registry installer offered to overwrite it. No Animate UI component was added: the installed Base UI primitives already provide the required interaction semantics, while Anime.js remains narrowly scoped to Formula Signature drawing.

### Project-specific lifecycle components

- `RecipeActions`: primary save/update control plus grouped secondary lifecycle actions.
- `SavedRecipesDialog`: local library cards with load, rename, duplicate, and explicit named delete confirmation.
- `FormulaSignature`: a deterministic, non-evaluative visual fingerprint derived from normalized formula and loading inputs.
- `RecipePrintSheet`: a dedicated semantic print tree; it does not print the live application UI.
- `RecipePdfDocument`: a vector/text document driven by the same pure presentation model as print.
- `ContextHelp`: a shared, focusable tooltip trigger for domain terminology.

These are domain compositions rather than replacement control primitives. They reuse Button, Dialog, Dropdown Menu, Input, and Tooltip behavior from the shared UI layer.

## Configured registries

| Namespace      | URL template                               | Used                                                |
| -------------- | ------------------------------------------ | --------------------------------------------------- |
| `@react-bits`  | `https://reactbits.dev/r/{name}`           | Yes — existing Spotlight Card and BorderGlow source |
| `@vengeanceui` | `https://www.vengenceui.com/r/{name}.json` | Yes — Perspective Grid                              |

## React Bits source

### Spotlight Card

- Official entry: `https://reactbits.dev/r/SpotlightCard-TS-TW`
- Exact command: `corepack pnpm exec shadcn add @react-bits/SpotlightCard-TS-TW --path src/components/effects`
- Local path: `src/components/effects/SpotlightCard.tsx`
- Used in: `src/features/dough-calculator/components/format-cards.tsx`
- Role: acid-lime pointer illumination on the two accessible format radio choices.
- Local changes: client directive, token colors, class merging, flexible color type, and a reduced-motion `disabled` prop.
- Reduced motion/mobile: pointer illumination is disabled under reduced motion and has no role in selection or layout. Touch users receive the same static radio cards.

### BorderGlow

- Official entry: `https://reactbits.dev/r/BorderGlow-TS-TW`
- Exact command: `corepack pnpm exec shadcn add @react-bits/BorderGlow-TS-TW --path src/components/effects`
- Local path: `src/components/effects/BorderGlow.tsx`
- Used in: `src/features/dough-calculator/components/recipe-summary.tsx`, and nowhere else.
- Role: the one focal edge treatment around the live recipe instrument.
- Local changes: client directive, acid-lime/white/graphite mesh, token surfaces, 12px default radius, restrained glow, and reduced-motion/touch disabling.
- Reduced motion/mobile: completely static when reduced motion is requested or no fine pointer exists.

## Vengeance UI source

### Perspective Grid

- Official entry: `https://www.vengenceui.com/r/perspective-grid.json`
- Exact installed command: `corepack pnpm exec shadcn add @vengeanceui/perspective-grid --yes`
- Local path: `src/components/ui/perspective-grid.tsx`
- Used in: `src/features/dough-calculator/components/dough-field.tsx` inside the Dough Lab stage only.
- Role: spatial measurement substrate beneath the round and planar Dough Field geometry.
- Local changes: removed mount-only state; converted hardcoded white/black/gray to project tokens; reduced density; changed the transform and transparent fade; added sparse deterministic acid-lime active lines.
- Reduced motion/mobile: contains no autonomous animation. Density and height are constrained by the Dough Field container.

## Existing Motion components

| Component              | Local path                                                      | Use                                                                |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Animated number        | `src/features/dough-calculator/components/animated-number.tsx`  | Total-weight transitions without an initial count-up               |
| Format selection       | `src/features/dough-calculator/components/format-cards.tsx`     | Shared selected marker transition                                  |
| Pizza preview          | `src/features/dough-calculator/components/dough-field.tsx`      | Reversible indexed frames; direct final frame under reduced motion |
| Advanced layer         | `src/features/dough-calculator/components/dough-calculator.tsx` | Compact reveal/removal                                             |
| Ingredient composition | `src/features/dough-calculator/components/composition-bar.tsx`  | Segment width changes                                              |
| Warnings               | `src/features/dough-calculator/components/issue-list.tsx`       | Advisory/error arrival and removal                                 |

All Motion components call `useReducedMotion`; content is present without waiting for an animation.

## shadcn / Base UI source

| Primitive | Local path                      | Used for                                                               |
| --------- | ------------------------------- | ---------------------------------------------------------------------- |
| Input     | `src/components/ui/input.tsx`   | Numeric fields, flour names, custom ingredients                        |
| Select    | `src/components/ui/select.tsx`  | Recipe profiles, baking surfaces, pans, leavening and ingredient types |
| Slider    | `src/components/ui/slider.tsx`  | Linear measurement rails paired with editable numeric inputs           |
| Switch    | `src/components/ui/switch.tsx`  | Advanced state, manual sizing, and measured-pan state                  |
| Label     | `src/components/ui/label.tsx`   | Programmatic input names                                               |
| Button    | `src/components/ui/button.tsx`  | Add/remove/normalize editor actions                                    |
| Tooltip   | `src/components/ui/tooltip.tsx` | Shared accessible tooltip provider                                     |

These retained primitives supply keyboard behavior, focus management, labeling, popup positioning, and touch semantics. They were restyled at shared source paths rather than replaced by decorative custom controls.

## Project-specific visual component

### Pizza preview

- Local path: `src/features/dough-calculator/components/dough-field.tsx`
- Built from: a South Jersey Sourdough reference bake, a 30-frame WebP sprite,
  the official Perspective Grid, SVG framing marks, live calculation data, and
  a native `requestAnimationFrame` controller.
- Why custom: no registry component represents round diameter contours, sheet-pan interior dimensions, hydration, dough loading, total weight, and quantity together. The brief explicitly permits this one domain-specific visualization.
- Accessibility: the SVG is decorative, while a live text caption describes the exact geometry and values. Mode selection and calculation never depend on the drawing. Reduced-motion users receive the final geometry immediately.
- Scientific scope: illustrative only; the interface labels it as such and makes no simulation claim.

## Removed visual code

- `src/components/three/dough-visualizer.tsx`
- `src/components/three/dough-visualizer-scene.tsx`
- `src/features/dough-calculator/components/mobile-summary-bar.tsx`
- Dependencies `@react-three/fiber`, `@react-three/drei`, `three`, and `@types/three`

The removed WebGL/CSS fallback was the rejected dough ball/blob direction. The fixed mobile summary was also removed so it cannot duplicate or cover the early primary result.

## Reviewed but not added

- Vengeance UI Animated Number: not used because it declares `framer-motion`, duplicates the installed `motion` package, and does not support the project’s formatted units as well as the existing implementation.
- Additional React Bits components: not added. Spotlight Card and BorderGlow already fill the only documented roles, staying within the one-additional-component limit.
