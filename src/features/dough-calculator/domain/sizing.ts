import type { SizingInput, SizingResult } from "../types/dough";

/**
 * Dough sizing: baking area in, target dough weight out.
 *
 * Pure functions only. Full precision is preserved here; rounding belongs to
 * the display layer.
 */

/** Area of a round pizza of the given diameter, in square inches. */
export function calculateRoundArea(diameterInches: number): number {
  return Math.PI * Math.pow(diameterInches / 2, 2);
}

/**
 * Area of a rectangular pan, in square inches.
 *
 * Callers must pass the measured usable interior dimensions. Nominal outer
 * sizes overstate the baking surface on any rimmed pan.
 */
export function calculateRectangularArea(
  usableInteriorLengthInches: number,
  usableInteriorWidthInches: number
): number {
  return usableInteriorLengthInches * usableInteriorWidthInches;
}

/** Area of a single pizza or pan for either shape. */
export function calculateAreaPerUnit(sizing: SizingInput): number {
  return sizing.shape === "round"
    ? calculateRoundArea(sizing.diameterInches)
    : calculateRectangularArea(
        sizing.usableInteriorLengthInches,
        sizing.usableInteriorWidthInches
      );
}

/**
 * Resolves area, quantity and the sizing mode into a target dough weight.
 *
 * In `dough-loading` mode the weight is derived from the loading. In
 * `manual-dough-weight` mode the entered weight is respected exactly and the
 * loading it implies is back-calculated, flagged via `isLoadingDerived`.
 */
export function calculateSizing(sizing: SizingInput): SizingResult {
  const areaPerUnitSquareInches = calculateAreaPerUnit(sizing);
  const { quantity, selection } = sizing;

  const doughWeightPerUnitGrams =
    selection.mode === "dough-loading"
      ? areaPerUnitSquareInches * selection.doughLoadingGramsPerSquareInch
      : selection.doughWeightPerUnitGrams;

  const effectiveDoughLoadingGramsPerSquareInch =
    selection.mode === "dough-loading"
      ? selection.doughLoadingGramsPerSquareInch
      : selection.doughWeightPerUnitGrams / areaPerUnitSquareInches;

  return {
    shape: sizing.shape,
    areaPerUnitSquareInches,
    quantity,
    doughWeightPerUnitGrams,
    totalDoughWeightGrams: doughWeightPerUnitGrams * quantity,
    effectiveDoughLoadingGramsPerSquareInch,
    isLoadingDerived: selection.mode === "manual-dough-weight",
  };
}
