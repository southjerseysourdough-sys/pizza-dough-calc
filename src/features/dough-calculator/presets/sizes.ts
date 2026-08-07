import { calculateRoundArea } from "../domain/sizing";

/**
 * Standard round pizza sizes.
 *
 * The whole ladder hangs off one anchor: a 16" pie gets a 480 g dough ball.
 * Every other size is that same dough loading applied to its own area, so
 * moving between sizes keeps the crust the same thickness rather than the
 * same weight.
 *
 * Deriving the loading from the anchor — rather than writing 2.39 g/in²
 * somewhere and hoping it still produces 480 g — means the standard size can
 * never quietly drift away from the number on the label.
 */

/** The reference dough ball this tool sizes everything else from. */
export const STANDARD_ROUND_ANCHOR = {
  diameterInches: 16,
  doughGrams: 480,
} as const;

/**
 * Grams of dough per square inch that yields the anchor above.
 *
 * Rounded to four decimals because this value is editable in the advanced
 * controls, and an irrational figure would show up there as a wall of digits.
 * The cost is 0.005 g on a 16" pie, which no scale resolves and no display
 * shows.
 */
export const STANDARD_ROUND_DOUGH_LOADING =
  Math.round(
    (STANDARD_ROUND_ANCHOR.doughGrams /
      calculateRoundArea(STANDARD_ROUND_ANCHOR.diameterInches)) *
      1e4
  ) / 1e4;

export type RoundSizePreset = {
  readonly diameterInches: number;
  /** Chip label, e.g. `16"`. */
  readonly label: string;
};

export const ROUND_SIZE_PRESETS: readonly RoundSizePreset[] = [
  { diameterInches: 9, label: '9"' },
  { diameterInches: 10, label: '10"' },
  { diameterInches: 12, label: '12"' },
  { diameterInches: 14, label: '14"' },
  { diameterInches: 16, label: '16"' },
  { diameterInches: 18, label: '18"' },
];
