# Component inventory

Updated for the Linear redesign on 2026-08-03. Registry URLs are configured in `components.json` and were verified against their live official entries before implementation.

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

| Component              | Local path                                                      | Use                                                  |
| ---------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Animated number        | `src/features/dough-calculator/components/animated-number.tsx`  | Total-weight transitions without an initial count-up |
| Format selection       | `src/features/dough-calculator/components/format-cards.tsx`     | Shared selected marker transition                    |
| Dough Field            | `src/features/dough-calculator/components/dough-field.tsx`      | Geometry response to hydration/loading changes       |
| Advanced layer         | `src/features/dough-calculator/components/dough-calculator.tsx` | Compact reveal/removal                               |
| Ingredient composition | `src/features/dough-calculator/components/composition-bar.tsx`  | Segment width changes                                |
| Warnings               | `src/features/dough-calculator/components/issue-list.tsx`       | Advisory/error arrival and removal                   |

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

### Dough Field

- Local path: `src/features/dough-calculator/components/dough-field.tsx`
- Built from: the official Perspective Grid, SVG measurement primitives, design tokens, live calculation data, and Motion.
- Why custom: no registry component represents round diameter contours, sheet-pan interior dimensions, hydration, dough loading, total weight, and quantity together. The brief explicitly permits this one domain-specific visualization.
- Accessibility: the SVG is decorative, while a live text caption describes the exact geometry and values. Mode selection and calculation never depend on the drawing.
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
