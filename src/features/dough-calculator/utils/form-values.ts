import type { CalculatorFormValues } from "../types/calculator-form";
import type {
  CustomIngredientInput,
  DoughFormulaInput,
  FlourBlendItem,
  LeaveningInput,
  SizingInput,
  ValidationIssue,
} from "../types/dough";

export const FLOUR_BLEND_TOLERANCE_PERCENT = 0.1;
export const RESERVED_INGREDIENT_NAMES = [
  "flour",
  "water",
  "salt",
  "yeast",
  "starter",
] as const;

export function isReservedIngredientName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return RESERVED_INGREDIENT_NAMES.some((reserved) => reserved === normalized);
}

const toDecimal = (percentValue: number): number => percentValue / 100;

function toSizingInput(values: CalculatorFormValues): SizingInput {
  const selection =
    values.sizingMode === "dough-loading"
      ? {
          mode: "dough-loading" as const,
          doughLoadingGramsPerSquareInch: values.doughLoadingGramsPerSquareInch,
        }
      : {
          mode: "manual-dough-weight" as const,
          doughWeightPerUnitGrams: values.manualDoughWeightGrams,
        };
  return values.shape === "round"
    ? {
        shape: "round",
        diameterInches: values.diameterInches,
        quantity: values.quantity,
        selection,
      }
    : {
        shape: "rectangular",
        usableInteriorLengthInches: values.usableInteriorLengthInches,
        usableInteriorWidthInches: values.usableInteriorWidthInches,
        quantity: values.quantity,
        selection,
      };
}

function toLeaveningInput(values: CalculatorFormValues): LeaveningInput {
  const starter = {
    percentageOfTotalFlour: toDecimal(values.starterPercent),
    hydration: toDecimal(values.starterHydrationPercent),
  };
  if (values.leaveningMethod === "commercial-yeast")
    return {
      method: "commercial-yeast",
      yeastType: values.yeastType,
      yeastPercentage: toDecimal(values.yeastPercent),
    };
  if (values.leaveningMethod === "sourdough")
    return { method: "sourdough", starter };
  return {
    method: "hybrid",
    yeastType: values.yeastType,
    yeastPercentage: toDecimal(values.yeastPercent),
    starter,
  };
}

export function toDoughFormulaInput(
  values: CalculatorFormValues
): DoughFormulaInput {
  const flourBlend: FlourBlendItem[] = values.flourBlend.map((item) => ({
    ...item,
    percentage: toDecimal(item.percentage),
  }));
  const customIngredients: CustomIngredientInput[] =
    values.customIngredients.map((item) => ({
      ...item,
      percentage: toDecimal(item.percentage),
    }));
  return {
    sizing: toSizingInput(values),
    hydration: toDecimal(values.hydrationPercent),
    salt: toDecimal(values.saltPercent),
    fatType: values.fatType,
    fat: toDecimal(values.fatPercent),
    sugar: toDecimal(values.sugarPercent),
    malt: toDecimal(values.maltPercent),
    leavening: toLeaveningInput(values),
    customIngredients,
    flourBlend,
  };
}

/** Converts durable decimal engine input back to the percentage-based editor. */
export function recipeInputToFormValues(
  input: DoughFormulaInput
): CalculatorFormValues {
  const sizing = input.sizing;
  const starter =
    input.leavening.method === "commercial-yeast"
      ? null
      : input.leavening.starter;
  const usesYeast = input.leavening.method !== "sourdough";
  const selection = sizing.selection;
  const area =
    sizing.shape === "round"
      ? Math.PI * Math.pow(sizing.diameterInches / 2, 2)
      : sizing.usableInteriorLengthInches * sizing.usableInteriorWidthInches;
  const loading =
    selection.mode === "dough-loading"
      ? selection.doughLoadingGramsPerSquareInch
      : 2.8;
  return {
    shape: sizing.shape,
    diameterInches: sizing.shape === "round" ? sizing.diameterInches : 14,
    usableInteriorLengthInches:
      sizing.shape === "rectangular" ? sizing.usableInteriorLengthInches : 18,
    usableInteriorWidthInches:
      sizing.shape === "rectangular" ? sizing.usableInteriorWidthInches : 13,
    quantity: sizing.quantity,
    sizingMode: selection.mode,
    doughLoadingGramsPerSquareInch: loading,
    manualDoughWeightGrams:
      selection.mode === "manual-dough-weight"
        ? selection.doughWeightPerUnitGrams
        : Math.round(area * loading),
    hydrationPercent: input.hydration * 100,
    saltPercent: input.salt * 100,
    fatType: input.fatType,
    fatPercent: input.fat * 100,
    sugarPercent: input.sugar * 100,
    maltPercent: input.malt * 100,
    leaveningMethod: input.leavening.method,
    yeastType: usesYeast ? input.leavening.yeastType : "instant-dry",
    yeastPercent: usesYeast ? input.leavening.yeastPercentage * 100 : 0.2,
    starterPercent: starter ? starter.percentageOfTotalFlour * 100 : 20,
    starterHydrationPercent: starter ? starter.hydration * 100 : 100,
    flourBlend: input.flourBlend.map((item) => ({
      ...item,
      percentage: item.percentage * 100,
    })),
    customIngredients: input.customIngredients.map((item) => ({
      ...item,
      percentage: item.percentage * 100,
    })),
  };
}

function issue(field: string, message: string): ValidationIssue {
  return { code: "invalid-input", severity: "error", field, message };
}

export function validateCalculatorFormValues(
  values: CalculatorFormValues
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!["round", "rectangular"].includes(values.shape))
    issues.push(issue("shape", "Choose a supported pizza format."));
  if (!["dough-loading", "manual-dough-weight"].includes(values.sizingMode))
    issues.push(issue("sizingMode", "Choose a supported sizing method."));
  if (!["none", "olive-oil", "neutral-oil", "tallow"].includes(values.fatType))
    issues.push(issue("fatType", "Choose a supported fat type."));
  if (
    !["commercial-yeast", "sourdough", "hybrid"].includes(
      values.leaveningMethod
    )
  )
    issues.push(
      issue("leaveningMethod", "Choose a supported leavening method.")
    );
  if (!["instant-dry", "active-dry", "fresh"].includes(values.yeastType))
    issues.push(issue("yeastType", "Choose a supported yeast type."));
  const positive = [
    ["diameterInches", values.diameterInches],
    ["usableInteriorLengthInches", values.usableInteriorLengthInches],
    ["usableInteriorWidthInches", values.usableInteriorWidthInches],
    ["doughLoadingGramsPerSquareInch", values.doughLoadingGramsPerSquareInch],
    ["manualDoughWeightGrams", values.manualDoughWeightGrams],
    ["hydrationPercent", values.hydrationPercent],
    ["starterHydrationPercent", values.starterHydrationPercent],
  ] as const;
  for (const [field, value] of positive) {
    if (!Number.isFinite(value)) issues.push(issue(field, "Enter a number."));
    else if (value <= 0)
      issues.push(issue(field, "Must be greater than zero."));
  }
  const nonNegative = [
    ["saltPercent", values.saltPercent],
    ["fatPercent", values.fatPercent],
    ["sugarPercent", values.sugarPercent],
    ["maltPercent", values.maltPercent],
    ["yeastPercent", values.yeastPercent],
    ["starterPercent", values.starterPercent],
  ] as const;
  for (const [field, value] of nonNegative) {
    if (!Number.isFinite(value)) issues.push(issue(field, "Enter a number."));
    else if (value < 0) issues.push(issue(field, "Cannot be negative."));
  }
  if (!Number.isInteger(values.quantity) || values.quantity <= 0)
    issues.push(
      issue(
        "quantity",
        Number.isInteger(values.quantity)
          ? "Make at least one."
          : "Use a whole number."
      )
    );
  if (!Array.isArray(values.flourBlend) || values.flourBlend.length === 0)
    issues.push(issue("flourBlend", "Add at least one flour."));
  else {
    let total = 0;
    for (const item of values.flourBlend) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        typeof item.name !== "string"
      ) {
        issues.push(issue("flourBlend", "This flour entry is invalid."));
        continue;
      }
      if (!item.id || !item.name.trim())
        issues.push(issue("flourBlend", "Name the flour."));
      if (
        !Number.isFinite(item.percentage) ||
        item.percentage < 0 ||
        item.percentage > 100
      )
        issues.push(
          issue("flourBlend", "Flour percentages must be from 0% to 100%.")
        );
      total += item.percentage;
    }
    if (
      Number.isFinite(total) &&
      Math.abs(total - 100) > FLOUR_BLEND_TOLERANCE_PERCENT
    )
      issues.push(
        issue(
          "flourBlend",
          `Flour blend must total 100%. It currently totals ${total.toFixed(1)}%.`
        )
      );
  }
  if (!Array.isArray(values.customIngredients))
    issues.push(issue("customIngredients", "Custom ingredients are invalid."));
  else
    for (const item of values.customIngredients) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        typeof item.name !== "string"
      ) {
        issues.push(
          issue("customIngredients", "This custom ingredient is invalid.")
        );
        continue;
      }
      if (!item.id || !item.name.trim())
        issues.push(issue("customIngredients", "Name the ingredient."));
      else if (isReservedIngredientName(item.name))
        issues.push(
          issue(
            "customIngredients",
            `The formula already tracks ${item.name.trim()} separately. Use a different name.`
          )
        );
      if (!Number.isFinite(item.percentage) || item.percentage < 0)
        issues.push(
          issue(
            "customIngredients",
            "Custom ingredient percentages cannot be negative."
          )
        );
    }
  return issues;
}
