import type { CalculatorFormValues } from "../schemas/calculator-schema";
import type { CalculatorPreset } from "./formulas";

/**
 * Converts a preset's engine-shaped input into the percentage-based values the
 * form edits. Presets are authored in decimals so they can be fed straight to
 * the engine in tests.
 */

const toPercent = (decimal: number): number => decimal * 100;

/**
 * Fallbacks for fields a preset does not exercise, so switching leavening
 * method or shape never lands the user on an empty input.
 */
const FORM_DEFAULTS = {
  diameterInches: 14,
  usableInteriorLengthInches: 18,
  usableInteriorWidthInches: 13,
  doughLoadingGramsPerSquareInch: 2.8,
  starterPercent: 20,
  starterHydrationPercent: 100,
  yeastPercent: 0.2,
} as const;

export function presetToFormValues(
  preset: CalculatorPreset
): CalculatorFormValues {
  const { input } = preset;
  const { sizing, leavening } = input;

  const starter =
    leavening.method === "commercial-yeast" ? null : leavening.starter;
  const yeastPercent =
    leavening.method === "sourdough"
      ? FORM_DEFAULTS.yeastPercent
      : toPercent(leavening.yeastPercentage);
  const yeastType =
    leavening.method === "sourdough" ? "instant-dry" : leavening.yeastType;

  const doughLoadingGramsPerSquareInch =
    sizing.selection.mode === "dough-loading"
      ? sizing.selection.doughLoadingGramsPerSquareInch
      : FORM_DEFAULTS.doughLoadingGramsPerSquareInch;

  // Seed the manual field with the weight the preset's loading produces, so
  // toggling to manual mode starts from the same dough rather than a jump.
  const areaPerUnit =
    sizing.shape === "round"
      ? Math.PI * Math.pow(sizing.diameterInches / 2, 2)
      : sizing.usableInteriorLengthInches * sizing.usableInteriorWidthInches;

  const manualDoughWeightGrams =
    sizing.selection.mode === "manual-dough-weight"
      ? sizing.selection.doughWeightPerUnitGrams
      : Math.round(areaPerUnit * doughLoadingGramsPerSquareInch);

  return {
    shape: sizing.shape,
    diameterInches:
      sizing.shape === "round"
        ? sizing.diameterInches
        : FORM_DEFAULTS.diameterInches,
    usableInteriorLengthInches:
      sizing.shape === "rectangular"
        ? sizing.usableInteriorLengthInches
        : FORM_DEFAULTS.usableInteriorLengthInches,
    usableInteriorWidthInches:
      sizing.shape === "rectangular"
        ? sizing.usableInteriorWidthInches
        : FORM_DEFAULTS.usableInteriorWidthInches,
    quantity: sizing.quantity,

    sizingMode: sizing.selection.mode,
    doughLoadingGramsPerSquareInch,
    manualDoughWeightGrams,

    hydrationPercent: toPercent(input.hydration),
    saltPercent: toPercent(input.salt),
    fatType: input.fatType,
    fatPercent: toPercent(input.fat),
    sugarPercent: toPercent(input.sugar),
    maltPercent: toPercent(input.malt),

    leaveningMethod: leavening.method,
    yeastType,
    yeastPercent,
    starterPercent: starter
      ? toPercent(starter.percentageOfTotalFlour)
      : FORM_DEFAULTS.starterPercent,
    starterHydrationPercent: starter
      ? toPercent(starter.hydration)
      : FORM_DEFAULTS.starterHydrationPercent,

    flourBlend: input.flourBlend.map((item) => ({
      id: item.id,
      name: item.name,
      percentage: toPercent(item.percentage),
    })),
    customIngredients: input.customIngredients.map((item) => ({
      id: item.id,
      name: item.name,
      percentage: toPercent(item.percentage),
    })),
  };
}
