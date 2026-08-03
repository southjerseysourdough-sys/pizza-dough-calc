/**
 * Flour blend helpers.
 *
 * Pure functions operating on the percentage values the editor holds (whole
 * numbers, so 62.5 means 62.5%). No React, no store.
 */

/** Decimal places the blend editor shows and normalises to. */
export const BLEND_PERCENT_DECIMALS = 2;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function sumPercentages(values: readonly number[]): number {
  return values.reduce(
    (total, value) => total + (Number.isFinite(value) ? value : 0),
    0
  );
}

/**
 * Scales percentages so they total exactly 100.
 *
 * Existing proportions are preserved: a 3:1 split stays 3:1. Rows are only
 * given an equal share when there is nothing to scale, meaning every value is
 * zero (or non-finite) and proportion is undefined.
 *
 * Rounding is done once, then the leftover from rounding is pushed onto the
 * largest row. That keeps every row at the editor's displayed precision while
 * guaranteeing the visible total reads exactly 100% — repeatedly nudging rows
 * would drift the proportions instead.
 */
export function normalizeFlourPercentages(
  values: readonly number[],
  decimals: number = BLEND_PERCENT_DECIMALS
): number[] {
  if (values.length === 0) return [];

  const safe = values.map((value) => (Number.isFinite(value) ? value : 0));
  // Negative entries cannot carry a meaningful share of the blend.
  const positive = safe.map((value) => (value > 0 ? value : 0));
  const total = sumPercentages(positive);

  const scaled =
    total > 0
      ? positive.map((value) => (value / total) * 100)
      : // Nothing to scale, so split evenly.
        positive.map(() => 100 / positive.length);

  const rounded = scaled.map((value) => roundTo(value, decimals));

  // Rounding rarely lands on exactly 100; give the remainder to the biggest
  // row, where it is proportionally least visible.
  const residual = roundTo(100 - sumPercentages(rounded), decimals);
  if (residual !== 0) {
    let largestIndex = 0;
    for (let index = 1; index < rounded.length; index += 1) {
      if (rounded[index] > rounded[largestIndex]) largestIndex = index;
    }
    rounded[largestIndex] = roundTo(rounded[largestIndex] + residual, decimals);
  }

  return rounded;
}

/** Creates an id that stays stable for the lifetime of a row. */
export function createRowId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
