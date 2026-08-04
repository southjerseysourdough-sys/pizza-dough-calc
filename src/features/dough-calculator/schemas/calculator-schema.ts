import { z } from "zod";

import type { DoughFormulaInput } from "../types/dough";
import type { CalculatorFormValues } from "../types/calculator-form";
import {
  FLOUR_BLEND_TOLERANCE_PERCENT,
  isReservedIngredientName,
} from "../utils/form-values";
export type { CalculatorFormValues } from "../types/calculator-form";
export {
  FLOUR_BLEND_TOLERANCE_PERCENT,
  RESERVED_INGREDIENT_NAMES,
  isReservedIngredientName,
  toDoughFormulaInput,
} from "../utils/form-values";

/**
 * Validation for the user-editable calculator form.
 *
 * The form works in the units bakers type: percentages are whole numbers here
 * (65 means 65%), not the decimals the domain engine uses. `toDoughFormulaInput`
 * performs that conversion at the boundary, so the engine only ever sees
 * decimals and the interface only ever shows percentages.
 */

const percent = z
  .number({ message: "Enter a number." })
  .finite("Enter a number.")
  .min(0, "Cannot be negative.");

const positiveNumber = z
  .number({ message: "Enter a number." })
  .finite("Enter a number.")
  .positive("Must be greater than zero.");

const decimalRatio = z.number().finite().min(0);

const doughSizingSelectionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("dough-loading"),
    doughLoadingGramsPerSquareInch: positiveNumber,
  }),
  z.object({
    mode: z.literal("manual-dough-weight"),
    doughWeightPerUnitGrams: positiveNumber,
  }),
]);

const doughSizingInputSchema = z.discriminatedUnion("shape", [
  z.object({
    shape: z.literal("round"),
    diameterInches: positiveNumber,
    quantity: z.number().int().positive(),
    selection: doughSizingSelectionSchema,
  }),
  z.object({
    shape: z.literal("rectangular"),
    usableInteriorLengthInches: positiveNumber,
    usableInteriorWidthInches: positiveNumber,
    quantity: z.number().int().positive(),
    selection: doughSizingSelectionSchema,
  }),
]);

const starterConfigurationSchema = z.object({
  percentageOfTotalFlour: decimalRatio,
  hydration: positiveNumber,
});

const leaveningInputSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("commercial-yeast"),
    yeastType: z.enum(["instant-dry", "active-dry", "fresh"]),
    yeastPercentage: decimalRatio,
  }),
  z.object({
    method: z.literal("sourdough"),
    starter: starterConfigurationSchema,
  }),
  z.object({
    method: z.literal("hybrid"),
    yeastType: z.enum(["instant-dry", "active-dry", "fresh"]),
    yeastPercentage: decimalRatio,
    starter: starterConfigurationSchema,
  }),
]);

/**
 * The single structural schema for durable engine input.
 * Recipe documents, imports, shares and storage all compose this schema.
 */
export const doughFormulaInputSchema: z.ZodType<DoughFormulaInput> = z.object({
  sizing: doughSizingInputSchema,
  hydration: positiveNumber,
  salt: decimalRatio,
  fatType: z.enum(["none", "olive-oil", "neutral-oil", "tallow"]),
  fat: decimalRatio,
  sugar: decimalRatio,
  malt: decimalRatio,
  leavening: leaveningInputSchema,
  customIngredients: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().trim().min(1),
      percentage: decimalRatio,
    })
  ),
  flourBlend: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1),
        percentage: decimalRatio,
      })
    )
    .min(1),
});

export const flourBlendItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name the flour."),
  percentage: percent.max(100, "Cannot exceed 100%."),
});

/**
 * Names the formula already accounts for on its own.
 *
 * Matching is exact and case-insensitive after trimming, deliberately not a
 * substring test: "Poolish Salt", "Vital Wheat Gluten" and "Milk Powder" are
 * all legitimate ingredients that a substring rule would wrongly reject.
 */
export const customIngredientSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1, "Name the ingredient."),
    percentage: percent,
  })
  .superRefine((item, ctx) => {
    if (isReservedIngredientName(item.name)) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: `The formula already tracks ${item.name.trim()} separately. Use a different name.`,
      });
    }
  });

export const calculatorFormSchema: z.ZodType<CalculatorFormValues> = z
  .object({
    shape: z.enum(["round", "rectangular"]),
    diameterInches: positiveNumber,
    usableInteriorLengthInches: positiveNumber,
    usableInteriorWidthInches: positiveNumber,
    quantity: z
      .number()
      .int("Use a whole number.")
      .positive("Make at least one."),

    sizingMode: z.enum(["dough-loading", "manual-dough-weight"]),
    doughLoadingGramsPerSquareInch: positiveNumber,
    manualDoughWeightGrams: positiveNumber,

    hydrationPercent: positiveNumber,
    saltPercent: percent,
    fatType: z.enum(["none", "olive-oil", "neutral-oil", "tallow"]),
    fatPercent: percent,
    sugarPercent: percent,
    maltPercent: percent,

    leaveningMethod: z.enum(["commercial-yeast", "sourdough", "hybrid"]),
    yeastType: z.enum(["instant-dry", "active-dry", "fresh"]),
    yeastPercent: percent,
    starterPercent: percent,
    starterHydrationPercent: positiveNumber,

    flourBlend: z.array(flourBlendItemSchema),
    customIngredients: z.array(customIngredientSchema),
  })
  .superRefine((values, ctx) => {
    if (values.flourBlend.length === 0) return;

    const total = values.flourBlend.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    if (Math.abs(total - 100) > FLOUR_BLEND_TOLERANCE_PERCENT) {
      ctx.addIssue({
        code: "custom",
        path: ["flourBlend"],
        message: `Flour blend must total 100%. It currently totals ${total.toFixed(1)}%.`,
      });
    }
  });
