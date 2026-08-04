import type {
  PizzaRecipeDocument,
  RecipeContext,
  RecipeMigrationResult,
} from "../domain/recipe-document";
import type { FermentationPlanInput } from "../domain/fermentation";
import type { CalculatorFormValues } from "../types/calculator-form";
import {
  toDoughFormulaInput,
  validateCalculatorFormValues,
} from "./form-values";

/** Creates the in-memory presentation candidate without loading import/storage schemas. */
export function createRecipeDraftDocument({
  name,
  values,
  context,
  fermentationPlan,
}: {
  name: string;
  values: CalculatorFormValues;
  context: RecipeContext;
  fermentationPlan?: FermentationPlanInput;
}): RecipeMigrationResult<PizzaRecipeDocument> {
  if (validateCalculatorFormValues(values).length > 0)
    return {
      ok: false,
      message:
        "Fix the highlighted calculator values before using this recipe.",
    };
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 80)
    return {
      ok: false,
      message: "Give this recipe a name of 80 characters or fewer.",
    };
  return {
    ok: true,
    value: {
      schemaVersion: 2,
      name: trimmedName,
      calculatorInput: toDoughFormulaInput(values),
      context,
      ...(fermentationPlan ? { fermentationPlan } : {}),
    },
  };
}
