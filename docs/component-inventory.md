# Component inventory

Every non-shadcn visual component in this project, plus the candidates that
were reviewed and rejected. Registry entries live in
[`components.json`](../components.json).

## Configured registries

| Namespace      | URL template                               | Used this pass |
| -------------- | ------------------------------------------ | -------------- |
| `@react-bits`  | `https://reactbits.dev/r/{name}`           | Yes            |
| `@vengeanceui` | `https://www.vengenceui.com/r/{name}.json` | No             |

Both were verified by fetching them directly. The React Bits registry index at
`https://reactbits.dev/r/registry.json` self-identifies as `"name": "@react-bits"`
with 556 items, which is where the exact slugs below came from. Only the free
React Bits registry is used; no Pro licence is configured or assumed.

---

## Installed

### SpotlightCard

| Field           | Value                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Library         | React Bits (free registry)                                                                                 |
| Display name    | Spotlight Card                                                                                             |
| Documentation   | https://reactbits.dev                                                                                      |
| Registry entry  | https://reactbits.dev/r/SpotlightCard-TS-TW                                                                |
| Install command | `pnpm dlx shadcn@latest add @react-bits/SpotlightCard-TS-TW --path src/components/effects`                 |
| Local path      | `src/components/effects/SpotlightCard.tsx`                                                                 |
| Dependencies    | None. The registry entry declares `"dependencies": []`, and installing it added nothing to `package.json`. |
| Used in         | `src/features/dough-calculator/components/recipe-summary.tsx`                                              |

**Why this one.** The live recipe is the piece of the page a baker actually
looks at, and a soft pointer-following highlight marks it as the focal surface
without animating anything on its own. It was also the only card treatment
reviewed that needed no new runtime dependency.

**Reduced motion.** The spotlight is driven entirely by pointer position and
never animates by itself. Its only transition is an opacity fade, which the
global `prefers-reduced-motion` rule in `globals.css` reduces to effectively
zero. Nothing moves for keyboard-only users.

**Mobile.** Pointer events never fire on touch, so the effect is simply absent
and the card renders as a plain surface. No layout, spacing or readability
difference, and no touch handlers are attached.

**Local modifications** — the file diverges from upstream in four documented
places, all noted in its header comment:

1. Added `"use client"`. The registry source omits it despite using
   `useState` and `useRef`, so it fails to compile in a Server Component tree.
2. Replaced the hardcoded `border-neutral-800 bg-neutral-900` shell with design
   tokens (`bg-card`, `ring-foreground/10`). Upstream is dark-only and would
   have been an unreadable black box in light mode.
3. Swapped string concatenation for `cn`, so callers can override padding and
   radius instead of fighting duplicate Tailwind classes.
4. Widened `spotlightColor` from an `rgba(...)` template literal type to
   `string`, so a `color-mix` token value can be passed.

---

## Reviewed and rejected

Each candidate below was fetched from its registry and read before deciding.

| Candidate            | Library      | Verdict                                                                                                                                                                                                                                               |
| -------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grainient**        | React Bits   | Rejected. Declares `ogl@^1.0.11`, adding a second WebGL runtime beside the `three` already installed for the R3F layer. Duplicate cost, one job.                                                                                                      |
| **Animated Content** | React Bits   | Rejected. Declares `gsap@^3.13.0`, duplicating animation capability that `motion` already provides.                                                                                                                                                   |
| **Fade Content**     | React Bits   | Rejected. Same `gsap@^3.13.0` dependency, for an entrance fade Motion does in three lines.                                                                                                                                                            |
| **Electric Border**  | React Bits   | Rejected. Zero dependencies, but it is a continuously glowing animated border — explicitly on the design brief's avoid list.                                                                                                                          |
| **Animated Rays**    | Vengeance UI | Rejected. Zero dependencies, but the source hardcodes a `#60a5fa` / `#e879f9` / `#5eead4` blue-fuchsia-teal gradient: the generic-SaaS look the brief rules out. It also references an `animate-aurora-bg` keyframe the registry entry does not ship. |
| **Perspective Grid** | Vengeance UI | Rejected. Verified to exist with zero dependencies, but it serves the same atmospheric purpose as the R3F layer, and the brief forbids using two libraries for one visual purpose.                                                                    |
| **Glow Border Card** | Vengeance UI | Rejected. Verified to exist with zero dependencies, but it overlaps with SpotlightCard, and a constant glowing border is on the avoid list.                                                                                                           |
| **Kinetic Loader**   | Vengeance UI | **Does not exist.** `https://www.vengenceui.com/r/kinetic-loader.json` returns HTTP 404. The name appears in the brief's candidate list but maps to no registry slug.                                                                                 |

---

## Built in-house rather than installed

Two of the three permitted effect slots are filled without a third-party
component, because the dependency cost was not worth it:

| Purpose               | Implementation                                                              | Rationale                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background/atmosphere | `src/components/three/flour-dust-scene.tsx` with React Three Fiber and Drei | Phase 8 requires an R3F proof of concept regardless, and `three` is already a dependency. Adding `ogl` for Grainient would have shipped a second WebGL runtime to do the same job. |
| Entrance/reveal       | `motion` directly, in `dough-calculator.tsx`                                | Both React Bits entrance components require GSAP. Motion is already installed and does a staggered fade natively.                                                                  |

---

## Adding more components

React Bits — note the `-TS-TW` suffix, which selects the TypeScript + Tailwind
variant, and the explicit path:

```bash
pnpm dlx shadcn@latest add @react-bits/<Component>-TS-TW --path src/components/effects
```

Vengeance UI:

```bash
pnpm dlx shadcn@latest add @vengeanceui/<component-slug>
```

House rules learned the hard way this pass:

- **Confirm the slug against the registry before installing.** Display names do
  not reliably map to slugs, and at least one documented candidate (Kinetic
  Loader) has no registry entry at all. `curl` the JSON URL and check for a 200.
- **Read the registry entry's `dependencies` array first.** It is the cheapest
  way to find out that a "free, zero-config" component pulls in GSAP or OGL.
- **Expect to add `"use client"`.** React Bits sources ship without it and
  effectively all of them use hooks.
- **Expect to replace hardcoded colours with tokens.** Several assume a dark
  background.
- **Record every local modification here and in the file header**, since these
  are vendored copies with no upgrade path other than a re-pull and re-diff.
