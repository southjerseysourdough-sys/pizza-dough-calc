# Pizza Dough Calc

A precision workspace for planning and scaling pizza dough by baking area,
with round-steel and sheet-pan modes, baker&rsquo;s percentages, sourdough,
commercial yeast, and hybrid formulas.

Recipes can be named and saved locally, reopened, renamed, duplicated, shared
by URL, copied as readable text, moved as versioned JSON, printed, or exported
as a selectable-text PDF. The application has no account or server recipe
store: the local library stays in the current browser, while share links carry
the recipe source inputs in the URL and are not permanent hosted records.

## Stack

| Concern    | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19               |
| Language   | TypeScript, strict                                          |
| Styling    | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`) |
| Components | shadcn/ui on Base UI (`base-nova` style)                    |
| Effects    | React Bits, via the shadcn registry                         |
| Visuals    | SVG Dough Field + Vengeance UI Perspective Grid             |
| Animation  | Motion + scoped Anime.js SVG timelines                      |
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
- A valid shared `?r=` payload takes precedence over the local draft for that
  page load, but is never automatically added to My Recipes.
- JSON import validates and previews the recipe before applying it; importing
  does not implicitly save it.
- The web app manifest provides install metadata and icons. There is no service
  worker, so the project does not claim offline support.

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
