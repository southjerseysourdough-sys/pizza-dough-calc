# Fermentation and Baking Day performance audit

Measured from the optimized Next.js 16.2.12 production build on 2026-08-03.
`tests/e2e/measure-route-bundles.mjs` opens each route in Chromium, records the
JavaScript files actually requested before `networkidle`, and reports local raw,
gzip level 9, and Brotli sizes. These totals include Next/React shared runtime,
so they are not directly comparable to a report that counts only route-owned
modules.

| Initial route        |         Raw |      Gzip |    Brotli |
| -------------------- | ----------: | --------: | --------: |
| Calculator `/`       | 1,476,437 B | 432,750 B | 369,962 B |
| Baking Day `/bake`   | 1,657,526 B | 496,116 B | 426,252 B |
| Baking Day increment |   181,089 B |  63,366 B |  56,290 B |

The meaningful new route cost is the Baking Day increment, not its full total:
the remainder is framework and domain code shared with the calculator. The
focused Baking Day component is in a 34,301-byte raw route-only chunk. Its
session domain is also dynamically loaded from the calculator only after an
explicit Start Baking Day action.

## Five largest emitted client chunks

|         Raw |      Gzip |    Brotli | Role                                                                                |
| ----------: | --------: | --------: | ----------------------------------------------------------------------------------- |
| 1,446,922 B | 480,583 B | 386,068 B | React PDF and its rendering stack; lazy and absent from both initial route requests |
|   337,155 B | 105,935 B |  89,063 B | Calculator application, Base UI, and Motion integration                             |
|   294,386 B |  67,965 B |  55,274 B | Shared validation/domain vendor code, including Zod                                 |
|   227,543 B |  70,856 B |  60,630 B | React DOM runtime                                                                   |
|   146,333 B |  39,146 B |  33,594 B | Shared framework/vendor runtime                                                     |

Hash filenames are deliberately omitted because production rebuilds may rename
them. The measurement script reports the current names when exact artifact
matching is needed.

## Loading decisions

- React PDF remains behind the existing dynamic `import()` and is not requested
  on initial calculator or Baking Day navigation.
- The saved-recipe dialog is dynamically imported and rendered only when open;
  its current 6,830-byte raw chunk is absent from initial navigation.
- The fermentation planner is dynamically imported only when its workspace is
  opened; its current 14,321-byte raw UI chunk is absent initially.
- Baking Day is a static route split at `/bake`. Its UI and native browser API
  integration are absent from the initial calculator request.
- The JSON import preview stays in the action surface because it adds no parsing
  library and shares the existing canonical migration boundary.
- `react-to-print` remains on the calculator route because the dedicated print
  sheet and hook are small relative to the route and preserve the already-tested
  synchronous print workflow. React PDF carries the material document cost and
  remains lazy.
- Anime.js is imported with named APIs only in the existing Dough Field. That
  above-the-fold visualization remains intentional and no second animation
  engine was added.
- Playwright, Vitest, screenshot capture, and bundle measurement files remain
  outside application imports and therefore outside production client chunks.

The earlier approximately 929 KB raw figure used a different route accounting
boundary. The browser-request totals above are the reproducible current
baseline; compressed sizes and the route increment are the more useful network
context. Raw size alone is not presented as a user-experience improvement.
