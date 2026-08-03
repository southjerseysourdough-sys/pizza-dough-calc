# Pizza Dough Calc

A precision workspace for planning and scaling pizza dough.

The calculator itself is not built yet — this repository currently holds the
application foundation and a placeholder dashboard.

## Stack

| Concern    | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) + React 19               |
| Language   | TypeScript, strict                                          |
| Styling    | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`) |
| Components | shadcn/ui on Base UI (`base-nova` style)                    |
| Effects    | React Bits, via the shadcn registry                         |
| 3D         | React Three Fiber + drei                                    |
| Animation  | Motion                                                      |
| State      | Zustand                                                     |
| Forms      | React Hook Form + Zod                                       |

## Getting started

```bash
pnpm install
```

```bash
pnpm dev
```

The app runs at http://localhost:3000.

## Scripts

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `pnpm dev`          | Development server         |
| `pnpm build`        | Production build           |
| `pnpm start`        | Serve the production build |
| `pnpm lint`         | ESLint                     |
| `pnpm lint:fix`     | ESLint with autofix        |
| `pnpm typecheck`    | `tsc --noEmit`             |
| `pnpm format`       | Prettier write             |
| `pnpm format:check` | Prettier check             |

## Structure

```
src/
  app/          routes, layouts, metadata — thin, composes features
  components/
    ui/         shadcn/ui primitives
    react-bits/ vendored React Bits sources (see its README)
    layout/     app shell
    providers.tsx  single client boundary for app-wide providers
  features/     vertical slices — the default home for new code
  hooks/        shared React hooks
  lib/          app constants, env parsing, cn helper
  store/        shared Zustand stores
  types/        shared type helpers
  utils/        pure helper functions
```

Two conventions carry most of the weight, and both are documented where they
apply: [`src/features/README.md`](src/features/README.md) for slice boundaries,
and [`src/components/react-bits/README.md`](src/components/react-bits/README.md)
for pulling in React Bits components.

## Adding components

shadcn/ui:

```bash
pnpm exec shadcn add <component>
```

React Bits — note the `-TS-TW` suffix and the explicit path:

```bash
pnpm exec shadcn add @react-bits/<Component>-TS-TW --path src/components/react-bits
```
