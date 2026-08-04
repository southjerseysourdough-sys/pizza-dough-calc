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

export const ONBOARDING_STEPS = [
  {
    title: "Choose your format",
    detail: "Start with round pizza on steel or a Sicilian-style sheet pan.",
    target: "format",
  },
  {
    title: "Enter size and quantity",
    detail: "The calculator scales dough from the baking area you enter.",
    target: "geometry",
  },
  {
    title: "Tune the formula",
    detail: "Hydration, flour, salt, yeast, and starter remain editable.",
    target: "formula",
  },
  {
    title: "Plan fermentation",
    detail: "Planning backward from bake time is the easiest place to start.",
    target: "fermentation",
  },
  {
    title: "Keep or bake it",
    detail: "Save, share, print, or start a focused Baking Day session.",
    target: "actions",
  },
] as const;
