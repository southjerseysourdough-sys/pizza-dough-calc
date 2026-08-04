# Production launch performance audit

Measured from optimized Next.js 16.2.12 production builds on 2026-08-03.
`tests/e2e/measure-route-bundles.mjs` opens each route in a fresh Chromium
context, records the JavaScript actually requested through `networkidle`, and
reports local raw, gzip level 9, and Brotli sizes. Totals include the shared
Next/React runtime.

## Before and after

| Browser-requested JavaScript | Baseline raw |   Final raw | Baseline gzip | Final gzip | Baseline Brotli | Final Brotli |
| ---------------------------- | -----------: | ----------: | ------------: | ---------: | --------------: | -----------: |
| Calculator `/`               |  1,476,437 B |   990,602 B |     432,750 B |  306,937 B |       369,962 B |    267,339 B |
| Baking Day `/bake`           |  1,657,526 B | 1,469,315 B |     496,116 B |  438,578 B |       426,252 B |    378,449 B |
| `/bake` minus `/`            |    181,089 B |   478,713 B |      63,366 B |  131,641 B |        56,290 B |    111,110 B |

The initial calculator is 485,835 bytes raw and 125,813 bytes gzip smaller: a
32.9% raw and 29.1% gzip reduction. It is below the 350 KB gzip launch target.
Baking Day is also 57,538 bytes gzip smaller in absolute terms. Its relative
increment is larger only because the comparison route shed large shared
dependencies that Baking Day still needs for durable session validation.

First-load CSS moved from 89,321 bytes raw / 15,354 bytes gzip to 94,384 bytes
raw / 16,421 bytes gzip. The 1,067-byte gzip increase supplies launch dialogs,
safe-area handling, loading/error states, and offline/install UI.

## Five largest final emitted client chunks

|         Raw |      Gzip |    Brotli | Role and loading behavior                                               |
| ----------: | --------: | --------: | ----------------------------------------------------------------------- |
| 1,446,922 B | 480,584 B | 386,007 B | React PDF stack; lazy and absent from initial `/` and `/bake` requests  |
|   290,740 B |  66,589 B |  53,914 B | Zod and durable validation; absent from initial `/`, present on `/bake` |
|   232,792 B |  72,523 B |  62,018 B | React DOM runtime                                                       |
|   146,333 B |  39,146 B |  33,594 B | shared framework/vendor runtime                                         |
|   134,601 B |  40,641 B |  34,245 B | calculator/launch application code                                      |

Hash filenames are omitted because a production rebuild may rename them. The
measurement script reports exact current filenames for artifact matching.

## Boundary and loading decisions

- Removed the second general animation runtime from eager components. Small
  numeric, reveal, and pizza-frame effects use CSS or `requestAnimationFrame`;
  Anime.js stays scoped to the Formula Signature drawing.
- The reference-bake pizza transition is one 472 KiB WebP sprite containing 30
  indexed 480×270 frames. It adds no JavaScript library, makes one request, can
  reverse from its current frame, and swaps immediately under reduced motion.
- Zod validation, saved-recipe persistence, share decoding, archive handling,
  fermentation schemas, and PDF generation now enter the calculator only when
  their workflows are requested.
- The eager recipe toolbar is small. Its full actions, print integration,
  saved-recipes workspace, JSON import, and PDF path load on first use.
- Command palette, Help, Data Management, onboarding, fermentation planner, and
  saved-recipes UI are dynamic secondary workspaces.
- `/bake` remains a statically generated route split. Its browser API adapters
  are isolated from the server route and from the initial calculator request.
- The root layout remains a server component with one provider boundary, and
  all routes in the production build are statically prerendered.
- No dependency was added for launch readiness. The native service worker is
  4 KB uncompressed and keeps the Turbopack production path unchanged.

Raw size is not presented as a user-experience metric by itself; the compressed
network figures and requested-route boundaries are the reproducible comparison.
