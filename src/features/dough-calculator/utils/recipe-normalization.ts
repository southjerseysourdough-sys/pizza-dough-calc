import type { PizzaRecipeDocument } from "../domain/recipe-document";
import type { DoughFormulaInput } from "../types/dough";

function stableNumber(value: number): number {
  return Number(value.toFixed(8));
}

export function normalizeRecipeInput(input: DoughFormulaInput): unknown {
  const sizing =
    input.sizing.shape === "round"
      ? {
          shape: "round",
          diameterInches: stableNumber(input.sizing.diameterInches),
          quantity: input.sizing.quantity,
          selection:
            input.sizing.selection.mode === "dough-loading"
              ? {
                  mode: "dough-loading",
                  doughLoadingGramsPerSquareInch: stableNumber(
                    input.sizing.selection.doughLoadingGramsPerSquareInch
                  ),
                }
              : {
                  mode: "manual-dough-weight",
                  doughWeightPerUnitGrams: stableNumber(
                    input.sizing.selection.doughWeightPerUnitGrams
                  ),
                },
        }
      : {
          shape: "rectangular",
          usableInteriorLengthInches: stableNumber(
            input.sizing.usableInteriorLengthInches
          ),
          usableInteriorWidthInches: stableNumber(
            input.sizing.usableInteriorWidthInches
          ),
          quantity: input.sizing.quantity,
          selection:
            input.sizing.selection.mode === "dough-loading"
              ? {
                  mode: "dough-loading",
                  doughLoadingGramsPerSquareInch: stableNumber(
                    input.sizing.selection.doughLoadingGramsPerSquareInch
                  ),
                }
              : {
                  mode: "manual-dough-weight",
                  doughWeightPerUnitGrams: stableNumber(
                    input.sizing.selection.doughWeightPerUnitGrams
                  ),
                },
        };
  const leavening =
    input.leavening.method === "commercial-yeast"
      ? {
          method: input.leavening.method,
          yeastType: input.leavening.yeastType,
          yeastPercentage: stableNumber(input.leavening.yeastPercentage),
        }
      : input.leavening.method === "sourdough"
        ? {
            method: input.leavening.method,
            starter: {
              percentageOfTotalFlour: stableNumber(
                input.leavening.starter.percentageOfTotalFlour
              ),
              hydration: stableNumber(input.leavening.starter.hydration),
            },
          }
        : {
            method: input.leavening.method,
            yeastType: input.leavening.yeastType,
            yeastPercentage: stableNumber(input.leavening.yeastPercentage),
            starter: {
              percentageOfTotalFlour: stableNumber(
                input.leavening.starter.percentageOfTotalFlour
              ),
              hydration: stableNumber(input.leavening.starter.hydration),
            },
          };

  return {
    sizing,
    hydration: stableNumber(input.hydration),
    salt: stableNumber(input.salt),
    fatType: input.fatType,
    fat: stableNumber(input.fat),
    sugar: stableNumber(input.sugar),
    malt: stableNumber(input.malt),
    leavening,
    flourBlend: input.flourBlend.map(({ name, percentage }) => ({
      name: name.trim(),
      percentage: stableNumber(percentage),
    })),
    customIngredients: input.customIngredients.map(({ name, percentage }) => ({
      name: name.trim(),
      percentage: stableNumber(percentage),
    })),
  };
}

export function normalizeRecipeDocument(document: PizzaRecipeDocument): string {
  return JSON.stringify({
    name: document.name.trim(),
    calculatorInput: normalizeRecipeInput(document.calculatorInput),
    context: document.context,
    fermentationPlan: document.fermentationPlan,
  });
}

export function areRecipeDocumentsEquivalent(
  left: PizzaRecipeDocument,
  right: PizzaRecipeDocument
): boolean {
  return normalizeRecipeDocument(left) === normalizeRecipeDocument(right);
}
