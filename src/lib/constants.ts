/** Static app-wide values. Anything environment-dependent belongs in `env.ts`. */

export const APP_NAME = "Pizza Dough Calc";

export const APP_DESCRIPTION =
  "A precision workspace for planning and scaling pizza dough.";

/** Primary navigation, consumed by the app shell. */
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
] as const satisfies ReadonlyArray<{ href: string; label: string }>;
