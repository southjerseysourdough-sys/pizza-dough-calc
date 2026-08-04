# Pizza Dough Calc

A precision workspace for planning and scaling pizza dough by baking area,
with round-steel and sheet-pan modes, baker&rsquo;s percentages, sourdough,
instant dry yeast, and optional hybrid formulas.

Recipes can be named and saved locally, reopened, renamed, duplicated, shared
by URL, copied as readable text, moved as versioned JSON, printed, or exported
as a selectable-text PDF. The application has no account or server recipe
store: the local library stays in the current browser, while share links carry
the recipe source inputs in the URL and are not permanent hosted records.

An optional fermentation planner schedules that unchanged formula forward from
a mix time or backward from a desired bake time. The route-split `/bake`
Baking Day workspace then provides stage instructions, reload-safe timestamp
timers, completion history, local notes, Wake Lock and best-effort browser
notification enhancements, and deterministic text/JSON bake reports.

## Stack

| Concern    | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19               |
| Language   | TypeScript, strict                                          |
| Styling    | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`) |
| Components | shadcn/ui on Base UI (`base-nova` style)                    |
| Effects    | React Bits, via the shadcn registry                         |
| Visuals    | Reference pizza frame sequence + Perspective Grid           |
| Animation  | CSS/requestAnimationFrame + scoped Anime.js SVG timelines   |
| State      | Zustand                                                     |
| Forms      | React Hook Form + Zod                                       |
| Documents  | react-to-print + dynamically loaded React PDF               |

## Getting started

```bash
pnpm install
```

```bash
pnpm dev
```

The app runs at http://localhost:3000.

## Scripts

| Script              | Purpose                     |
| ------------------- | --------------------------- |
| `pnpm dev`          | Development server          |
| `pnpm build`        | Production build            |
| `pnpm start`        | Serve the production build  |
| `pnpm lint`         | ESLint                      |
| `pnpm lint:fix`     | ESLint with autofix         |
| `pnpm typecheck`    | `tsc --noEmit`              |
| `pnpm format`       | Prettier write              |
| `pnpm format:check` | Prettier check              |
| `pnpm test`         | Vitest unit/component tests |
| `pnpm test:e2e`     | Playwright Chromium checks  |

## Local data and portability

- Draft inputs and saved recipes use browser `localStorage` with versioned,
  Zod-validated document envelopes.
- Readability preferences are local too: Atkinson Hyperlegible Next, IBM Plex
  Sans, and Geist are available at standard, comfortable, and large sizes.
- Recipe documents are currently schema version 2. Version 1 saves, JSON files,
  and shared URLs migrate through the same boundary without inventing a
  fermentation plan or changing formula inputs.
- Fermentation documents store source durations and a local wall-clock anchor
  in `YYYY-MM-DDTHH:mm` form, never derived stage timestamps. The recorded IANA
  timezone is a display/reference guard; opening in another timezone requires
  an explicit keep-or-rebase choice.
- Baking Day sessions use the
  `sjs:pizza-dough-calculator:baking-session:v1` local namespace. Timers use
  target timestamps as truth, so inactive tabs and reloads do not introduce
  interval drift.
- A valid shared `?r=` payload takes precedence over the local draft for that
  page load, but is never automatically added to My Recipes.
- JSON import validates and previews the recipe before applying it; importing
  does not implicitly save it.
- A versioned archive can export or import the complete recipe library. Archive
  imports validate and preview counts, offer merge or replacement, and rename
  identifier collisions instead of silently overwriting local recipes.
- The production-only service worker uses explicit `pdc-shell-v1` caches. The
  optional **Prepare for Offline Use** action stores the calculator, Baking Day,
  and their exact static assets; arbitrary share-query variants and imported
  recipe contents are never placed in app caches.
- Installation is progressive: the browser-owned prompt appears only after a
  user chooses Install App, while iOS receives manual Add to Home Screen
  guidance. No install or notification permission is requested automatically.
- Prepared Baking Day sessions keep timestamp-based timers, stage completion,
  and notes useful during a tested network loss. Browser storage can still be
  evicted, and timers or notifications cannot run after the device powers off.
  Fermentation schedules remain planning guidance, not scientifically precise
  fermentation predictions.

## Structure

```
src/
  app/          routes, layouts, metadata — thin, composes features
  components/
    ui/         shadcn/ui primitives
    effects/      vendored React Bits sources (see docs/component-inventory.md)
    layout/     app shell
    providers.tsx  single client boundary for app-wide providers
  features/     vertical slices — the default home for new code
  hooks/        shared React hooks
  lib/          app constants, env parsing, cn helper
  store/        shared Zustand stores
  types/        shared type helpers
  utils/        pure helper functions
```

Feature boundaries are documented in
[`src/features/README.md`](src/features/README.md), and copied registry source
is tracked in [`docs/component-inventory.md`](docs/component-inventory.md).

## Adding components

shadcn/ui:

```bash
pnpm exec shadcn add <component>
```

React Bits — note the `-TS-TW` suffix and the explicit path:

```bash
pnpm exec shadcn add @react-bits/<Component>-TS-TW --path src/components/react-bits
```
