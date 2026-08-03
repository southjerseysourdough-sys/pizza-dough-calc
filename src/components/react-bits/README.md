# React Bits

React Bits is not an npm dependency — it is a registry that vendors component
source directly into this repo. The `@react-bits` registry is declared in
[`components.json`](../../../components.json), so components are pulled with the
shadcn CLI:

```bash
pnpm exec shadcn add @react-bits/<Component>-TS-TW --path src/components/react-bits
```

Component names use the `<Name>-TS-TW` suffix, which selects the TypeScript +
Tailwind variant. Browse the catalogue at https://reactbits.dev.

## House rules

- **Always pass `--path src/components/react-bits`.** Without it the CLI drops
  files at the root of `src/components`.
- **Add `'use client'` to every component pulled in.** React Bits sources ship
  without the directive, and effectively all of them use hooks, refs, or
  animation loops that cannot run in a React Server Component.
- **Per-component peer dependencies install themselves.** The CLI reads them
  from the registry entry and runs the install for you — `motion` for most text
  and animation pieces, `gsap` + `@gsap/react` for the split-text family, `ogl`
  or `three` for the background pieces. Nothing is pre-installed here, so the
  bundle only grows with what you actually use.

## Local modifications

Files in this directory are vendored upstream sources and are excluded from
ESLint and Prettier (see `eslint.config.mjs` and `.prettierignore`) so they stay
diffable against the registry. Keep edits minimal — the `'use client'` directive
above is the expected exception.
