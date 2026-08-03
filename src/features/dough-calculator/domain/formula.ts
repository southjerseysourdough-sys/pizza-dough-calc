import type {
  DoughFormulaInput,
  FlourBlendResult,
  IngredientResult,
  LeaveningInput,
  StarterConfiguration,
  StarterResult,
} from "../types/dough";

/**
 * Baker's percentage engine.
 *
 * Every percentage is relative to total flour and is handled as a decimal
 * (0.65 means 65% hydration). Values stay at full floating point precision
 * throughout; nothing is rounded here.
 */

/** Fat is ignored entirely when the baker has selected no fat. */
export function effectiveFatPercentage(input: DoughFormulaInput): number {
  return input.fatType === "none" ? 0 : input.fat;
}

/** Commercial yeast is absent from a pure sourdough formula. */
export function commercialYeastPercentage(leavening: LeaveningInput): number {
  return leavening.method === "sourdough" ? 0 : leavening.yeastPercentage;
}

/** The starter attached to a formula, if the method uses one. */
export function starterConfiguration(
  leavening: LeaveningInput
): StarterConfiguration | null {
  return leavening.method === "commercial-yeast" ? null : leavening.starter;
}

export function sumCustomIngredientPercentages(
  input: DoughFormulaInput
): number {
  return input.customIngredients.reduce(
    (total, ingredient) => total + ingredient.percentage,
    0
  );
}

/**
 * Sum of every part of the dough expressed against flour, flour itself
 * included as the leading 1.
 *
 * A sourdough starter is deliberately absent: its flour and water are already
 * counted inside the flour and hydration terms. Adding it here would double
 * count the starter's mass.
 */
export function calculatePercentageSum(input: DoughFormulaInput): number {
  return (
    1 +
    input.hydration +
    input.salt +
    effectiveFatPercentage(input) +
    input.sugar +
    input.malt +
    commercialYeastPercentage(input.leavening) +
    sumCustomIngredientPercentages(input)
  );
}

/**
 * Solves total flour from a target dough weight.
 *
 * Ingredients are then derived from this single flour figure rather than by
 * scaling previously rounded weights, which would compound rounding error.
 */
export function calculateTotalFlour(
  targetDoughWeightGrams: number,
  percentageSum: number
): number {
  return targetDoughWeightGrams / percentageSum;
}

/**
 * Splits a starter into its flour and water components.
 *
 * Starter percentage is starter weight over total flour, and starter hydration
 * is starter water over starter flour. Since
 * `weight = flour + water` and `water = flour * hydration`, it follows that
 * `flour = weight / (1 + hydration)`.
 */
export function calculateStarter(
  totalFlourGrams: number,
  starter: StarterConfiguration
): StarterResult {
  const weightGrams = totalFlourGrams * starter.percentageOfTotalFlour;
  const flourGrams = weightGrams / (1 + starter.hydration);
  const waterGrams = weightGrams - flourGrams;

  return {
    weightGrams,
    flourGrams,
    waterGrams,
    hydration: starter.hydration,
    prefermentedFlourPercentage: flourGrams / totalFlourGrams,
  };
}

/**
 * Distributes the flour the baker actually weighs across the blend.
 *
 * The blend is applied to the added flour rather than to total flour: when a
 * starter is present its flour is already built and its composition is not
 * known unless the baker tells us. With no starter the two are identical.
 */
export function calculateFlourBlend(
  addedFlourGrams: number,
  blend: DoughFormulaInput["flourBlend"]
): readonly FlourBlendResult[] {
  return blend.map((item) => ({
    ...item,
    grams: addedFlourGrams * item.percentage,
  }));
}

/**
 * Builds the weigh-out list: what the baker actually puts on the scale.
 *
 * Flour and water appear as the *remaining* amounts, because any starter
 * already contributes part of each. Percentages stay relative to total flour
 * so they remain comparable across the formula.
 */
export function buildIngredientList(params: {
  readonly input: DoughFormulaInput;
  readonly totalFlourGrams: number;
  readonly remainingFlourGrams: number;
  readonly remainingWaterGrams: number;
  readonly starter: StarterResult | null;
}): readonly IngredientResult[] {
  const { input, totalFlourGrams, remainingFlourGrams, remainingWaterGrams } =
    params;
  const fat = effectiveFatPercentage(input);
  const yeast = commercialYeastPercentage(input.leavening);

  const ingredients: IngredientResult[] = [
    {
      id: "flour",
      label: "Flour",
      kind: "flour",
      bakersPercentage: remainingFlourGrams / totalFlourGrams,
      grams: remainingFlourGrams,
    },
    {
      id: "water",
      label: "Water",
      kind: "water",
      bakersPercentage: remainingWaterGrams / totalFlourGrams,
      grams: remainingWaterGrams,
    },
    {
      id: "salt",
      label: "Salt",
      kind: "salt",
      bakersPercentage: input.salt,
      grams: totalFlourGrams * input.salt,
    },
  ];

  if (params.starter) {
    ingredients.push({
      id: "starter",
      label: "Sourdough starter",
      kind: "starter",
      bakersPercentage: params.starter.weightGrams / totalFlourGrams,
      grams: params.starter.weightGrams,
    });
  }

  if (yeast > 0) {
    ingredients.push({
      id: "commercial-yeast",
      label: "Commercial yeast",
      kind: "yeast",
      bakersPercentage: yeast,
      grams: totalFlourGrams * yeast,
    });
  }

  if (fat > 0) {
    ingredients.push({
      id: "fat",
      label: "Fat",
      kind: "fat",
      bakersPercentage: fat,
      grams: totalFlourGrams * fat,
    });
  }

  if (input.sugar > 0) {
    ingredients.push({
      id: "sugar",
      label: "Sugar",
      kind: "sugar",
      bakersPercentage: input.sugar,
      grams: totalFlourGrams * input.sugar,
    });
  }

  if (input.malt > 0) {
    ingredients.push({
      id: "malt",
      label: "Malt",
      kind: "malt",
      bakersPercentage: input.malt,
      grams: totalFlourGrams * input.malt,
    });
  }

  for (const custom of input.customIngredients) {
    ingredients.push({
      id: custom.id,
      label: custom.name,
      kind: "custom",
      bakersPercentage: custom.percentage,
      grams: totalFlourGrams * custom.percentage,
    });
  }

  return ingredients;
}
