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

### BorderGlow

| Field           | Value                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Library         | React Bits (free registry)                                                                                 |
| Display name    | Border Glow                                                                                                |
| Documentation   | https://reactbits.dev                                                                                      |
| Registry entry  | https://reactbits.dev/r/BorderGlow-TS-TW                                                                   |
| Install command | `pnpm dlx shadcn@latest add @react-bits/BorderGlow-TS-TW --path src/components/effects`                    |
| Local path      | `src/components/effects/BorderGlow.tsx`                                                                    |
| Dependencies    | None. The registry entry declares `"dependencies": []`, and installing it added nothing to `package.json`. |
| Used in         | `src/features/dough-calculator/components/recipe-summary.tsx` — the result surface only                    |

**Why this one.** The recipe result had to become the strongest surface on the
page, and BorderGlow computes edge proximity and cursor angle to throw a light
cone at whichever edge the pointer is nearest. Retinted to ember that reads as
heat coming off the edge of a steel rather than as a neon border. It is the
only surface using it — nothing else on the page glows.

**Reduced motion.** `animated` is left false, so there is no opening sweep and
no render loop; the glow only responds to pointer position. The `disabled`
prop switches it off completely under `prefers-reduced-motion`.

**Mobile.** Also disabled when the device has no fine pointer, since a hover
effect can never fire on touch. The card falls back to a plain token surface
with no layout or readability difference.

**Local modifications** — four, all noted in the file header:

1. Added `"use client"`, absent from the registry source despite hook usage.
2. Retuned every default from the shipped `#c084fc` / `#f472b6` / `#38bdf8`
   mesh and `#120F17` fill to ember, crust, steel and workbench tokens.
3. Replaced `border-white/15` and a six-layer hardcoded black drop shadow with
   token equivalents, so it works in light as well as dark.
4. Added the `disabled` prop, and moved the opening sweep's first `setState`
   into a `requestAnimationFrame` callback — calling it straight from the
   effect body trips React's `set-state-in-effect` rule.

---

## Reviewed and rejected

Each candidate below was fetched from its registry and read before deciding.

| Candidate                                 | Library      | Verdict                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grainient**                             | React Bits   | Rejected. Declares `ogl@^1.0.11`, adding a second WebGL runtime beside the `three` already installed for the R3F layer. Duplicate cost, one job.                                                                                                                                                                                                                       |
| **Animated Content**                      | React Bits   | Rejected. Declares `gsap@^3.13.0`, duplicating animation capability that `motion` already provides.                                                                                                                                                                                                                                                                    |
| **Fade Content**                          | React Bits   | Rejected. Same `gsap@^3.13.0` dependency, for an entrance fade Motion does in three lines.                                                                                                                                                                                                                                                                             |
| **Electric Border**                       | React Bits   | Rejected. Zero dependencies, but it is a continuously glowing animated border — explicitly on the design brief's avoid list.                                                                                                                                                                                                                                           |
| **Animated Rays**                         | Vengeance UI | Rejected. Zero dependencies, but the source hardcodes a `#60a5fa` / `#e879f9` / `#5eead4` blue-fuchsia-teal gradient: the generic-SaaS look the brief rules out. It also references an `animate-aurora-bg` keyframe the registry entry does not ship.                                                                                                                  |
| **Perspective Grid**                      | Vengeance UI | Rejected. Verified to exist with zero dependencies, but it serves the same atmospheric purpose as the R3F layer, and the brief forbids using two libraries for one visual purpose.                                                                                                                                                                                     |
| **Glow Border Card**                      | Vengeance UI | Rejected. Verified to exist with zero dependencies, but it overlaps with SpotlightCard, and a constant glowing border is on the avoid list.                                                                                                                                                                                                                            |
| **Kinetic Loader**                        | Vengeance UI | **Does not exist.** `https://www.vengenceui.com/r/kinetic-loader.json` returns HTTP 404. The name appears in the brief's candidate list but maps to no registry slug.                                                                                                                                                                                                  |
| **Animated Number**                       | Vengeance UI | Rejected on dependencies and quality. It declares `framer-motion` as a direct dependency, duplicating the installed `motion` package, and it splits `value.toString()` into index-keyed digits, so it cannot carry a unit suffix or a decimal — "1.69 kg" is unrepresentable. Implemented instead with Motion's `useSpring` / `useTransform` in `animated-number.tsx`. |
| **Perspective Grid**                      | Vengeance UI | Verified present with zero dependencies, but the page already has a warm/steel CSS atmosphere layer and the R3F dough stage. A third atmospheric system would be the "page covered in effects" the brief rules out.                                                                                                                                                    |
| **Glow Border Card**                      | Vengeance UI | Verified present with zero dependencies, but React Bits BorderGlow now fills that role, and the brief explicitly says not to install both.                                                                                                                                                                                                                             |
| **Light Lines**                           | Vengeance UI | Verified present with zero dependencies. Not installed: it solves no problem this design has.                                                                                                                                                                                                                                                                          |
| **Wave Grid**, **Fluid Morph Background** | Vengeance UI | **Do not exist.** Both return HTTP 404 from the registry.                                                                                                                                                                                                                                                                                                              |
| **GlareHover**, **GradualBlur**           | React Bits   | Verified present with zero dependencies, but the brief caps React Bits at two components, and SpotlightCard plus BorderGlow already cover pointer illumination and the signature result surface.                                                                                                                                                                       |

**No Vengeance UI component is installed in this phase.** Every candidate
either duplicated something already present, added a redundant dependency, or
did not exist. Per the brief's fallback clause, the one interaction that
mattered — the animated result number — was implemented with Motion instead.

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
