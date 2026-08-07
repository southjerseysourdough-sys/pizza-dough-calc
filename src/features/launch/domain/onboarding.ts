export const ONBOARDING_VERSION = 1;
export const ONBOARDING_STORAGE_KEY = `pdc:onboarding:v${ONBOARDING_VERSION}`;

export function hasCompletedOnboarding(storage?: Storage): boolean {
  try {
    const target =
      storage ?? (typeof window === "undefined" ? null : window.localStorage);
    return target?.getItem(ONBOARDING_STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

export function completeOnboarding(storage?: Storage): boolean {
  try {
    const target =
      storage ?? (typeof window === "undefined" ? null : window.localStorage);
    if (!target) return false;
    target.setItem(ONBOARDING_STORAGE_KEY, "complete");
    return true;
  } catch {
    return false;
  }
}

export function resetOnboarding(storage?: Storage): boolean {
  try {
    const target =
      storage ?? (typeof window === "undefined" ? null : window.localStorage);
    if (!target) return false;
    target.removeItem(ONBOARDING_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * The tour mirrors the numbered steps on the page one for one, so the
 * walkthrough and the interface never describe two different workflows.
 */
export const ONBOARDING_STEPS = [
  {
    title: "Step 1 — Round pizza or pan pizza?",
    detail: "This decides which sizes and dough styles you are offered.",
    target: "format",
  },
  {
    title: "Step 2 — Pick a size",
    detail:
      'Standard sizes are one tap. A 16" pizza is the standard 480 g dough ball.',
    target: "geometry",
  },
  {
    title: "Step 3 — Say how many",
    detail: "Enter your target number of pizzas and everything scales to it.",
    target: "quantity",
  },
  {
    title: "Step 4 — Choose your dough",
    detail:
      "Pick a style and set hydration. Advanced options are there when you want them.",
    target: "formula",
  },
  {
    title: "Then keep or bake it",
    detail:
      "Your recipe sits at the end: save, share, print, or start a Baking Day session.",
    target: "actions",
  },
] as const;
