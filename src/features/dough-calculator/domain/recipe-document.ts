import { z } from "zod";

import {
  calculatorFormSchema,
  doughFormulaInputSchema,
  toDoughFormulaInput,
} from "../schemas/calculator-schema";
import type { CalculatorFormValues } from "../schemas/calculator-schema";
import type { DoughFormulaInput } from "../types/dough";

export const RECIPE_SCHEMA_VERSION = 1 as const;
export const RECIPE_NAME_MAX_LENGTH = 80;

export const recipeContextSchema = z.object({
  presetId: z.string().min(1),
  surfaceId: z.string().min(1),
  panProfileId: z.string().min(1),
  panInteriorMeasured: z.boolean(),
});

export const pizzaRecipeDocumentV1Schema = z.object({
  schemaVersion: z.literal(RECIPE_SCHEMA_VERSION),
  name: z.string().trim().min(1).max(RECIPE_NAME_MAX_LENGTH),
  calculatorInput: doughFormulaInputSchema,
  context: recipeContextSchema,
});

export const localSavedPizzaRecipeV1Schema = z.object({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  document: pizzaRecipeDocumentV1Schema,
});

export const localRecipeCollectionV1Schema = z
  .object({
    schemaVersion: z.literal(RECIPE_SCHEMA_VERSION),
    recipes: z.array(localSavedPizzaRecipeV1Schema),
  })
  .superRefine((collection, context) => {
    const identifiers = new Set<string>();
    collection.recipes.forEach((recipe, index) => {
      if (identifiers.has(recipe.id)) {
        context.addIssue({
          code: "custom",
          path: ["recipes", index, "id"],
          message: "Saved recipe identifiers must be unique.",
        });
      }
      identifiers.add(recipe.id);
    });
  });

export const sharedPizzaRecipeV1Schema = z.object({
  schemaVersion: z.literal(RECIPE_SCHEMA_VERSION),
  document: pizzaRecipeDocumentV1Schema,
});

export const importedRecipeFileSchema = pizzaRecipeDocumentV1Schema;

export type RecipeContext = z.infer<typeof recipeContextSchema>;
export type PizzaRecipeDocumentV1 = z.infer<typeof pizzaRecipeDocumentV1Schema>;
export type LocalSavedPizzaRecipeV1 = z.infer<
  typeof localSavedPizzaRecipeV1Schema
>;
export type LocalRecipeCollectionV1 = z.infer<
  typeof localRecipeCollectionV1Schema
>;
export type SharedPizzaRecipeV1 = z.infer<typeof sharedPizzaRecipeV1Schema>;

export type RecipeMigrationResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

export function migrateRecipeDocument(
  input: unknown
): RecipeMigrationResult<PizzaRecipeDocumentV1> {
  const version = readSchemaVersion(input);
  if (version !== RECIPE_SCHEMA_VERSION) {
    return {
      ok: false,
      message:
        version === null
          ? "This is not a recognized recipe document."
          : `Recipe schema version ${version} is not supported.`,
    };
  }
  const parsed = pizzaRecipeDocumentV1Schema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        message:
          "The recipe document is incomplete or contains invalid values.",
      };
}

export function migrateRecipeCollection(
  input: unknown
): RecipeMigrationResult<LocalRecipeCollectionV1> {
  const version = readSchemaVersion(input);
  if (version !== RECIPE_SCHEMA_VERSION) {
    return {
      ok: false,
      message:
        version === null
          ? "This is not a recognized recipe collection."
          : `Recipe collection version ${version} is not supported.`,
    };
  }
  const parsed = localRecipeCollectionV1Schema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        message: "Saved recipe data is invalid and was left unchanged.",
      };
}

function readSchemaVersion(input: unknown): number | null {
  if (
    typeof input !== "object" ||
    input === null ||
    !("schemaVersion" in input)
  )
    return null;
  const value = input.schemaVersion;
  return typeof value === "number" ? value : null;
}

export function createRecipeDocument({
  name,
  values,
  context,
}: {
  name: string;
  values: CalculatorFormValues;
  context: RecipeContext;
}): RecipeMigrationResult<PizzaRecipeDocumentV1> {
  const parsedValues = calculatorFormSchema.safeParse(values);
  if (!parsedValues.success)
    return {
      ok: false,
      message:
        "Fix the highlighted calculator values before saving this recipe.",
    };
  return migrateRecipeDocument({
    schemaVersion: RECIPE_SCHEMA_VERSION,
    name: name.trim(),
    calculatorInput: toDoughFormulaInput(parsedValues.data),
    context,
  });
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
