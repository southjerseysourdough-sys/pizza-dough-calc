import type {
  DoughFormulaInput,
  SizingInput,
  ValidationIssue,
} from "../types/dough";
import {
  calculatePercentageSum,
  calculateStarter,
  calculateTotalFlour,
  effectiveFatPercentage,
  starterConfiguration,
} from "./formula";
import { calculateSizing } from "./sizing";

/**
 * Hard validation. Anything reported here makes the formula unsolvable or
 * physically contradictory, so the engine refuses to produce a result.
 *
 * Merely unusual values belong in `warnings.ts` instead.
 */

/**
 * How far a flour blend may drift from 100% before we reject it.
 *
 * 0.001 as a decimal is one tenth of one percentage point, which absorbs
 * floating point drift and the rounding a baker does when typing percentages
 * such as 33.3 / 33.3 / 33.4.
 */
export const FLOUR_BLEND_TOLERANCE = 0.001;

function isValidNumber(value: number): boolean {
  return Number.isFinite(value);
}

function checkFinite(
  value: number,
  field: string,
  label: string
): ValidationIssue | null {
  return isValidNumber(value)
    ? null
    : {
        code: "not-finite",
        severity: "error",
        message: `${label} must be a number.`,
        field,
      };
}

function checkNonNegative(
  value: number,
  field: string,
  label: string
): ValidationIssue | null {
  const finite = checkFinite(value, field, label);
  if (finite) return finite;
  return value < 0
    ? {
        code: "negative-value",
        severity: "error",
        message: `${label} cannot be negative.`,
        field,
      }
    : null;
}

function checkPositive(
  value: number,
  field: string,
  label: string
): ValidationIssue | null {
  const finite = checkFinite(value, field, label);
  if (finite) return finite;
  return value <= 0
    ? {
        code: "not-positive",
        severity: "error",
        message: `${label} must be greater than zero.`,
        field,
      }
    : null;
}

function validateSizing(sizing: SizingInput): ValidationIssue[] {
  const issues: (ValidationIssue | null)[] = [
    checkPositive(sizing.quantity, "sizing.quantity", "Quantity"),
  ];

  if (sizing.shape === "round") {
    issues.push(
      checkPositive(
        sizing.diameterInches,
        "sizing.diameterInches",
        "Pizza diameter"
      )
    );
  } else {
    issues.push(
      checkPositive(
        sizing.usableInteriorLengthInches,
        "sizing.usableInteriorLengthInches",
        "Usable interior length"
      ),
      checkPositive(
        sizing.usableInteriorWidthInches,
        "sizing.usableInteriorWidthInches",
        "Usable interior width"
      )
    );
  }

  if (sizing.selection.mode === "dough-loading") {
    issues.push(
      checkPositive(
        sizing.selection.doughLoadingGramsPerSquareInch,
        "sizing.selection.doughLoadingGramsPerSquareInch",
        "Dough loading"
      )
    );
  } else {
    issues.push(
      checkPositive(
        sizing.selection.doughWeightPerUnitGrams,
        "sizing.selection.doughWeightPerUnitGrams",
        "Dough weight"
      )
    );
  }

  return issues.filter((issue): issue is ValidationIssue => issue !== null);
}

function validateFlourBlend(input: DoughFormulaInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // An empty blend simply means "one unspecified flour", which is valid.
  if (input.flourBlend.length === 0) return issues;

  for (const item of input.flourBlend) {
    const issue = checkNonNegative(
      item.percentage,
      `flourBlend.${item.id}`,
      `Flour blend percentage for ${item.name || "flour"}`
    );
    if (issue) issues.push(issue);
  }

  const total = input.flourBlend.reduce(
    (sum, item) => sum + item.percentage,
    0
  );

  if (
    isValidNumber(total) &&
    Math.abs(total - 1) > FLOUR_BLEND_TOLERANCE &&
    issues.length === 0
  ) {
    issues.push({
      code: "flour-blend-total",
      severity: "error",
      message: `Flour blend must total 100%. It currently totals ${(total * 100).toFixed(1)}%.`,
      field: "flourBlend",
    });
  }

  return issues;
}

function validatePercentages(input: DoughFormulaInput): ValidationIssue[] {
  const issues: (ValidationIssue | null)[] = [
    checkPositive(input.hydration, "hydration", "Hydration"),
    checkNonNegative(input.salt, "salt", "Salt"),
    checkNonNegative(effectiveFatPercentage(input), "fat", "Fat"),
    checkNonNegative(input.sugar, "sugar", "Sugar"),
    checkNonNegative(input.malt, "malt", "Malt"),
  ];

  if (input.leavening.method !== "sourdough") {
    issues.push(
      checkNonNegative(
        input.leavening.yeastPercentage,
        "leavening.yeastPercentage",
        "Yeast percentage"
      )
    );
  }

  const starter = starterConfiguration(input.leavening);
  if (starter) {
    issues.push(
      checkNonNegative(
        starter.percentageOfTotalFlour,
        "leavening.starter.percentageOfTotalFlour",
        "Starter percentage"
      ),
      checkPositive(
        starter.hydration,
        "leavening.starter.hydration",
        "Starter hydration"
      )
    );
  }

  for (const custom of input.customIngredients) {
    issues.push(
      checkNonNegative(
        custom.percentage,
        `customIngredients.${custom.id}`,
        `${custom.name || "Custom ingredient"} percentage`
      )
    );
  }

  return issues.filter((issue): issue is ValidationIssue => issue !== null);
}

/**
 * Cross-field checks that only make sense once the formula has been solved:
 * a starter cannot contribute more flour or water than the formula contains.
 */
function validateStarterContribution(
  input: DoughFormulaInput
): ValidationIssue[] {
  const starter = starterConfiguration(input.leavening);
  if (!starter) return [];

  const sizing = calculateSizing(input.sizing);
  const percentageSum = calculatePercentageSum(input);
  const totalFlourGrams = calculateTotalFlour(
    sizing.totalDoughWeightGrams,
    percentageSum
  );
  const totalWaterGrams = totalFlourGrams * input.hydration;
  const starterResult = calculateStarter(totalFlourGrams, starter);

  const issues: ValidationIssue[] = [];

  if (starterResult.flourGrams > totalFlourGrams) {
    issues.push({
      code: "starter-flour-exceeds-total",
      severity: "error",
      message:
        "The starter contains more flour than the whole formula. Lower the starter percentage.",
      field: "leavening.starter.percentageOfTotalFlour",
    });
  }

  if (starterResult.waterGrams > totalWaterGrams) {
    issues.push({
      code: "starter-water-exceeds-total",
      severity: "error",
      message:
        "The starter contains more water than the formula's total water. Lower the starter percentage or its hydration, or raise the dough hydration.",
      field: "leavening.starter.hydration",
    });
  }

  return issues;
}

/** Every hard error for an input, in one pass. */
export function validateFormulaInput(
  input: DoughFormulaInput
): readonly ValidationIssue[] {
  const issues = [
    ...validateSizing(input.sizing),
    ...validatePercentages(input),
    ...validateFlourBlend(input),
  ];

  // Only worth solving the formula once the raw fields are known to be sane.
  if (issues.length === 0) {
    issues.push(...validateStarterContribution(input));
  }

  return issues;
}
