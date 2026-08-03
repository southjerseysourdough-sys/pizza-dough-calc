import type {
  DoughCalculation,
  DoughFormulaInput,
  ValidationIssue,
} from "../types/dough";
import {
  buildIngredientList,
  calculateFlourBlend,
  calculatePercentageSum,
  calculateStarter,
  calculateTotalFlour,
  commercialYeastPercentage,
  starterConfiguration,
} from "./formula";
import { calculateSizing } from "./sizing";
import { validateFormulaInput } from "./validation";
import { checkYeastWeighability, collectFormulaWarnings } from "./warnings";

/**
 * The calculator's single entry point.
 *
 * Validates, solves the formula and gathers advisory warnings. Errors are
 * returned rather than thrown, and every number kept here is full precision —
 * rounding is the display layer's job.
 */
export function calculateDough(input: DoughFormulaInput): DoughCalculation {
  const errors = validateFormulaInput(input);
  if (errors.length > 0) {
    return { ok: false, issues: errors };
  }

  const sizing = calculateSizing(input.sizing);
  const percentageSum = calculatePercentageSum(input);
  const totalFlourGrams = calculateTotalFlour(
    sizing.totalDoughWeightGrams,
    percentageSum
  );
  const totalWaterGrams = totalFlourGrams * input.hydration;

  const starterConfig = starterConfiguration(input.leavening);
  const starter = starterConfig
    ? calculateStarter(totalFlourGrams, starterConfig)
    : null;

  // A starter's flour and water are already part of the totals above, so they
  // are subtracted out to leave what the baker still has to weigh.
  const remainingFlourGrams = totalFlourGrams - (starter?.flourGrams ?? 0);
  const remainingWaterGrams = totalWaterGrams - (starter?.waterGrams ?? 0);

  const ingredients = buildIngredientList({
    input,
    totalFlourGrams,
    remainingFlourGrams,
    remainingWaterGrams,
    starter,
  });

  const warnings: ValidationIssue[] = [
    ...collectFormulaWarnings(
      input,
      sizing.effectiveDoughLoadingGramsPerSquareInch
    ),
  ];

  const yeastGrams =
    totalFlourGrams * commercialYeastPercentage(input.leavening);
  const yeastWarning = checkYeastWeighability(yeastGrams);
  if (yeastWarning) warnings.push(yeastWarning);

  return {
    ok: true,
    result: {
      sizing,
      totalFlourGrams,
      remainingFlourGrams,
      totalWaterGrams,
      remainingWaterGrams,
      starter,
      // Computed rather than echoed back, so it demonstrates the invariant
      // that a starter does not change the formula's final hydration.
      trueFinalHydration: totalWaterGrams / totalFlourGrams,
      ingredients,
      flourBlend: calculateFlourBlend(remainingFlourGrams, input.flourBlend),
      totalDoughWeightGrams: sizing.totalDoughWeightGrams,
      warnings,
    },
  };
}
