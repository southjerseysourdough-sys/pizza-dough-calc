import { siteConfig } from "@/config/site";
import { calculateDough } from "../domain/calculate-dough";
import {
  createFormulaSignatureData,
  type FormulaSignatureData,
} from "../domain/formula-signature";
import type { PizzaRecipeDocument } from "../domain/recipe-document";
import {
  calculateFermentationTimeline,
  type FermentationStage,
} from "../domain/fermentation";
import { PAN_PROFILES, STEEL_PROFILES } from "../presets/equipment";
import { findPreset } from "../presets/formulas";
import type { IngredientKind, ValidationIssue } from "../types/dough";

export type PresentationIngredient = {
  id: string;
  label: string;
  kind: IngredientKind;
  grams: number;
  bakersPercentage: number;
};

export type RecipePresentationModel = {
  name: string;
  brand: string;
  product: string;
  style: string;
  shape: "round" | "rectangular";
  size: string;
  quantity: number;
  unitNoun: "pizza" | "pan";
  surface: string;
  doughWeightPerUnitGrams: number;
  totalDoughWeightGrams: number;
  hydration: number;
  doughLoading: number;
  mainIngredients: PresentationIngredient[];
  starter: null | {
    weightGrams: number;
    flourGrams: number;
    waterGrams: number;
    hydration: number;
    prefermentedFlourPercentage: number;
  };
  flourBlend: Array<{
    id: string;
    name: string;
    grams: number;
    percentage: number;
  }>;
  customIngredients: PresentationIngredient[];
  warnings: ValidationIssue[];
  signature: FormulaSignatureData;
  productionUrl: string;
  schedule: null | {
    timezone: string;
    mixTimestamp: number;
    bakeTimestamp: number;
    totalDurationMinutes: number;
    coldFermentMinutes: number;
    stages: FermentationStage[];
    advisories: string[];
    notes?: string;
  };
};

export type PresentationResult =
  { ok: true; value: RecipePresentationModel } | { ok: false; message: string };

export function createRecipePresentationModel(
  document: PizzaRecipeDocument
): PresentationResult {
  const calculation = calculateDough(document.calculatorInput);
  if (!calculation.ok)
    return {
      ok: false,
      message:
        "This recipe cannot be presented until its formula values are corrected.",
    };

  const result = calculation.result;
  const { sizing } = document.calculatorInput;
  const preset = findPreset(document.context.presetId);
  const surface =
    sizing.shape === "round"
      ? (STEEL_PROFILES.find(
          (candidate) => candidate.id === document.context.surfaceId
        )?.name ?? "Custom baking surface")
      : (PAN_PROFILES.find(
          (candidate) => candidate.id === document.context.panProfileId
        )?.name ?? "Custom pan");
  const size =
    sizing.shape === "round"
      ? `${sizing.diameterInches} inch diameter`
      : `${sizing.usableInteriorLengthInches} by ${sizing.usableInteriorWidthInches} inch measured interior`;
  const mainIngredients = result.ingredients.map((ingredient) => ({
    ...ingredient,
  }));
  const timeline = document.fermentationPlan?.enabled
    ? calculateFermentationTimeline(
        document.fermentationPlan,
        document.calculatorInput
      )
    : null;

  return {
    ok: true,
    value: {
      name: document.name,
      brand: siteConfig.brand,
      product: siteConfig.name,
      style: preset?.name ?? "Custom formula",
      shape: sizing.shape,
      size,
      quantity: sizing.quantity,
      unitNoun: sizing.shape === "round" ? "pizza" : "pan",
      surface,
      doughWeightPerUnitGrams: result.sizing.doughWeightPerUnitGrams,
      totalDoughWeightGrams: result.totalDoughWeightGrams,
      hydration: result.trueFinalHydration,
      doughLoading: result.sizing.effectiveDoughLoadingGramsPerSquareInch,
      mainIngredients,
      starter: result.starter ? { ...result.starter } : null,
      flourBlend: result.flourBlend.map((flour) => ({
        id: flour.id,
        name: flour.name,
        grams: flour.grams,
        percentage: flour.percentage,
      })),
      customIngredients: mainIngredients.filter(
        (ingredient) => ingredient.kind === "custom"
      ),
      warnings: [...result.warnings],
      signature: createFormulaSignatureData(document.calculatorInput),
      productionUrl: siteConfig.productionUrl,
      schedule:
        timeline?.ok && document.fermentationPlan
          ? {
              timezone: document.fermentationPlan.timezone,
              mixTimestamp: timeline.value.mixTimestamp,
              bakeTimestamp: timeline.value.bakeTimestamp,
              totalDurationMinutes: timeline.value.totalDurationMinutes,
              coldFermentMinutes: document.fermentationPlan.coldFermentMinutes,
              stages: timeline.value.stages,
              advisories: timeline.value.advisories.map(
                (advisory) => advisory.message
              ),
              notes: document.fermentationPlan.notes,
            }
          : null,
    },
  };
}

export function presentationMassTotal(model: RecipePresentationModel): number {
  return model.mainIngredients.reduce(
    (sum, ingredient) => sum + ingredient.grams,
    0
  );
}
