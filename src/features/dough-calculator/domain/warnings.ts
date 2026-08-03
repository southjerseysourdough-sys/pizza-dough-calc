import { shortestSurfaceEdgeInches } from "../presets/equipment";
import type { DoughFormulaInput, ValidationIssue } from "../types/dough";
import type { SteelProfile } from "../types/equipment";
import { effectiveFatPercentage } from "./formula";

/**
 * Advisory warnings.
 *
 * Everything here is calculable and possible — these values are simply outside
 * the range the presets were built around, so the baker gets a heads up rather
 * than a blocked form. Nothing in this file changes a formula.
 */

/**
 * Advisory thresholds, expressed as decimals.
 *
 * These bound the range this tool's presets were built around. They are not
 * claims about what is achievable: bakers work well outside them on purpose.
 */
export const ADVISORY_THRESHOLDS = {
  /** Below this, dough is typically stiff and hard to work by hand. */
  lowHydration: 0.5,
  /** Above this, dough is typically slack and needs specific handling. */
  highHydration: 0.9,
  /** Above roughly this, most bakers find the dough noticeably salty. */
  highSalt: 0.035,
  /**
   * Dough loading thresholds are per shape, because the two formats are not
   * comparable: a round pizza is stretched thin, while a pan pizza is meant to
   * be thick. A loading that signals a mistake on a steel is ordinary in a pan.
   */
  roundDoughLoading: 4.5,
  rectangularDoughLoading: 6.5,
} as const;

/**
 * Smallest increment a common home precision scale resolves reliably.
 *
 * 0.1 g reflects widely sold 0.1 g kitchen scales. It is a interface heuristic
 * for warning about hard-to-weigh amounts, not a scientific threshold, and it
 * never alters the formula.
 */
export const MIN_RELIABLE_SCALE_INCREMENT_GRAMS = 0.1;

export function collectFormulaWarnings(
  input: DoughFormulaInput,
  effectiveDoughLoadingGramsPerSquareInch: number
): readonly ValidationIssue[] {
  const warnings: ValidationIssue[] = [];

  if (input.hydration < ADVISORY_THRESHOLDS.lowHydration) {
    warnings.push({
      code: "low-hydration",
      severity: "warning",
      message: `Hydration of ${(input.hydration * 100).toFixed(1)}% is quite low. The dough will be stiff, which is workable but harder to stretch.`,
      field: "hydration",
    });
  }

  if (input.hydration > ADVISORY_THRESHOLDS.highHydration) {
    warnings.push({
      code: "high-hydration",
      severity: "warning",
      message: `Hydration of ${(input.hydration * 100).toFixed(1)}% is very high. Expect slack dough that needs wet hands and careful handling.`,
      field: "hydration",
    });
  }

  if (input.salt > ADVISORY_THRESHOLDS.highSalt) {
    warnings.push({
      code: "high-salt",
      severity: "warning",
      message: `Salt at ${(input.salt * 100).toFixed(1)}% is above the usual range and will taste noticeably salty.`,
      field: "salt",
    });
  }

  const loading = effectiveDoughLoadingGramsPerSquareInch;

  if (
    input.sizing.shape === "round" &&
    loading > ADVISORY_THRESHOLDS.roundDoughLoading
  ) {
    warnings.push({
      code: "high-dough-loading",
      severity: "warning",
      message: `A dough loading of ${loading.toFixed(2)} g/in² is heavy for a round pizza and will give a thick, bready crust. Double-check the diameter and dough weight if that was not intended.`,
      field: "sizing.selection",
    });
  }

  // Pan pizza is supposed to be thick, so this is a neutral observation rather
  // than a suggestion that anything is wrong.
  if (
    input.sizing.shape === "rectangular" &&
    loading > ADVISORY_THRESHOLDS.rectangularDoughLoading
  ) {
    warnings.push({
      code: "heavy-pan-dough",
      severity: "info",
      message: `At ${loading.toFixed(2)} g/in² this is a heavy pan dough. Expect a tall, focaccia-like crumb and a longer bake.`,
      field: "sizing.selection",
    });
  }

  const fat = effectiveFatPercentage(input);
  if (input.fatType === "none" && input.fat > 0) {
    warnings.push({
      code: "fat-ignored",
      severity: "warning",
      message: "Fat percentage is ignored because the fat type is set to none.",
      field: "fatType",
    });
  } else if (fat > 0.1) {
    warnings.push({
      code: "high-fat",
      severity: "warning",
      message: `Fat at ${(fat * 100).toFixed(1)}% is well above a typical pizza dough and moves the result toward an enriched dough.`,
      field: "fat",
    });
  }

  return warnings;
}

/**
 * Round pizza against a rectangular surface.
 *
 * A round pizza only fits if its diameter clears the surface's shortest edge.
 * This is guidance, never a formula change, and never a claim that the size is
 * impossible — bakers routinely launch slightly oversized pies.
 */
export function checkRoundSurfaceFit(
  diameterInches: number,
  profile: SteelProfile
): ValidationIssue | null {
  const shortestEdge = shortestSurfaceEdgeInches(profile);

  // Generic profiles carry no published dimensions until the baker enters them.
  if (shortestEdge <= 0) return null;
  if (diameterInches <= shortestEdge) return null;

  return {
    code: "surface-fit",
    severity: "warning",
    message: `A ${diameterInches}" pizza is wider than the ${shortestEdge}" short side of the ${profile.name}. It will overhang, so expect an uneven edge unless you shape it slightly oval or size down.`,
    field: "sizing.diameterInches",
  };
}

/**
 * Yeast quantities too small to weigh on a normal kitchen scale.
 *
 * The formula is never adjusted to make the number easier to weigh — the
 * baker is offered better ways to measure it instead.
 */
export function checkYeastWeighability(
  yeastGrams: number
): ValidationIssue | null {
  if (yeastGrams <= 0) return null;
  if (yeastGrams >= MIN_RELIABLE_SCALE_INCREMENT_GRAMS) return null;

  return {
    code: "yeast-below-scale-resolution",
    severity: "warning",
    message: `This formula needs ${yeastGrams.toFixed(3)} g of yeast, below what most kitchen scales resolve. Use a 0.01 g scale, mix a yeast solution and measure a portion of it, or scale the batch up.`,
    field: "leavening.yeastPercentage",
  };
}
