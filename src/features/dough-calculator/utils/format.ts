import type { IngredientKind } from "../types/dough";

/**
 * Display formatting.
 *
 * These functions never feed calculation. They take full precision domain
 * values and turn them into strings, which is the only place rounding happens.
 */

/** Ingredients weighed in whole grams versus ones needing finer resolution. */
const FINE_PRECISION_KINDS: ReadonlySet<IngredientKind> = new Set([
  "yeast",
  "malt",
]);

export function usesFinePrecision(kind: IngredientKind): boolean {
  return FINE_PRECISION_KINDS.has(kind);
}

/** Whole grams, for the bulk of a formula. */
export function formatWholeGrams(grams: number): string {
  if (!Number.isFinite(grams)) return "—";
  return `${Math.round(grams)}`;
}

/**
 * Small quantities, to two decimals.
 *
 * A positive value is never rendered as a bare zero: anything that would round
 * to 0.00 is shown as a "less than" bound instead, so the baker can see that
 * the ingredient is genuinely present. Rendering it as "0" would imply the
 * formula calls for none.
 */
export function formatFineGrams(grams: number): string {
  if (!Number.isFinite(grams)) return "—";
  if (grams === 0) return "0";
  if (grams > 0 && grams < 0.005) return "<0.01";
  return grams.toFixed(2);
}

/** Picks whole or fine formatting based on the ingredient. */
export function formatIngredientGrams(
  grams: number,
  kind: IngredientKind
): string {
  return usesFinePrecision(kind) || (grams > 0 && grams < 1)
    ? formatFineGrams(grams)
    : formatWholeGrams(grams);
}

/** A decimal ratio as a percentage string, e.g. 0.65 becomes "65%". */
export function formatPercentage(ratio: number, fractionDigits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  const percent = ratio * 100;
  // Drop a trailing ".0" so common whole values read cleanly.
  return Number.isInteger(percent)
    ? `${percent}%`
    : `${percent.toFixed(fractionDigits)}%`;
}

/** Square inches, to one decimal. */
export function formatArea(squareInches: number): string {
  if (!Number.isFinite(squareInches)) return "—";
  return `${squareInches.toFixed(1)} in²`;
}

/** Dough loading, to two decimals. */
export function formatDoughLoading(gramsPerSquareInch: number): string {
  if (!Number.isFinite(gramsPerSquareInch)) return "—";
  return `${gramsPerSquareInch.toFixed(2)} g/in²`;
}

/** Larger totals switch to kilograms so batch weights stay readable. */
export function formatTotalWeight(grams: number): string {
  if (!Number.isFinite(grams)) return "—";
  return grams >= 1000
    ? `${(grams / 1000).toFixed(2)} kg`
    : `${Math.round(grams)} g`;
}
