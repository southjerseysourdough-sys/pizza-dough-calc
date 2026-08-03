import { describe, expect, it } from "vitest";

import { calculateDough } from "../domain/calculate-dough";
import type { DoughFormulaInput, LeaveningInput } from "../types/dough";

/**
 * Raw calculation values only. Display formatting is covered separately in
 * format.test.ts so rounding can never mask a formula error.
 */

const INSTANT_YEAST: LeaveningInput = {
  method: "commercial-yeast",
  yeastType: "instant-dry",
  yeastPercentage: 0.002,
};

function baseInput(overrides: Partial<DoughFormulaInput> = {}) {
  const input: DoughFormulaInput = {
    sizing: {
      shape: "round",
      diameterInches: 16,
      quantity: 1,
      selection: { mode: "dough-loading", doughLoadingGramsPerSquareInch: 2.8 },
    },
    hydration: 0.63,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.02,
    sugar: 0.01,
    malt: 0.005,
    leavening: INSTANT_YEAST,
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
    ...overrides,
  };
  return input;
}

function expectOk(input: DoughFormulaInput) {
  const calculation = calculateDough(input);
  if (!calculation.ok) {
    throw new Error(
      `expected a valid calculation, got: ${calculation.issues.map((i) => i.code).join(", ")}`
    );
  }
  return calculation.result;
}

describe("total flour from target dough weight", () => {
  it("solves flour for one 16 inch pizza", () => {
    const result = expectOk(baseInput());

    // 201.06193 in² x 2.8 g/in² = 562.973404 g of dough.
    // Percentage sum = 1 + 0.63 + 0.02 + 0.02 + 0.01 + 0.005 + 0.002 = 1.687.
    expect(result.totalDoughWeightGrams).toBeCloseTo(562.9734, 4);
    expect(result.totalFlourGrams).toBeCloseTo(333.712747, 6);
  });

  it("conserves mass: every ingredient sums back to the dough weight", () => {
    const result = expectOk(baseInput());
    const summed = result.ingredients.reduce(
      (total, ingredient) => total + ingredient.grams,
      0
    );

    expect(summed).toBeCloseTo(result.totalDoughWeightGrams, 8);
  });

  it("scales linearly across three 16 inch pizzas", () => {
    const one = expectOk(baseInput());
    const three = expectOk(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: 16,
          quantity: 3,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 2.8,
          },
        },
      })
    );

    expect(three.totalFlourGrams).toBeCloseTo(one.totalFlourGrams * 3, 8);
    expect(three.totalDoughWeightGrams).toBeCloseTo(1688.9202, 4);
    expect(three.sizing.doughWeightPerUnitGrams).toBeCloseTo(562.9734, 4);
  });
});

describe("ingredient weights", () => {
  it("derives each ingredient from total flour", () => {
    const result = expectOk(baseInput());
    const byId = new Map(result.ingredients.map((i) => [i.id, i]));

    expect(byId.get("water")?.grams).toBeCloseTo(210.23903, 5);
    expect(byId.get("salt")?.grams).toBeCloseTo(6.674255, 6);
    expect(byId.get("malt")?.grams).toBeCloseTo(1.668564, 6);
    expect(byId.get("commercial-yeast")?.grams).toBeCloseTo(0.667425, 6);
  });

  it("omits fat entirely when the fat type is none", () => {
    const result = expectOk(baseInput({ fatType: "none", fat: 0.02 }));

    expect(result.ingredients.find((i) => i.kind === "fat")).toBeUndefined();
    // Removing fat from the percentage sum leaves more flour for the same
    // dough weight.
    expect(result.totalFlourGrams).toBeGreaterThan(333.712747);
  });

  it("includes custom ingredients in the percentage sum", () => {
    const withCustom = expectOk(
      baseInput({
        customIngredients: [
          { id: "semolina-topping", name: "Semolina", percentage: 0.03 },
        ],
      })
    );
    const without = expectOk(baseInput());

    expect(withCustom.totalFlourGrams).toBeLessThan(without.totalFlourGrams);
    const custom = withCustom.ingredients.find(
      (i) => i.id === "semolina-topping"
    );
    expect(custom?.grams).toBeCloseTo(withCustom.totalFlourGrams * 0.03, 8);
  });

  it("keeps hydration as the water to flour ratio", () => {
    const result = expectOk(baseInput());
    expect(result.totalWaterGrams / result.totalFlourGrams).toBeCloseTo(
      0.63,
      10
    );
  });
});

describe("flour blend weights", () => {
  it("splits the added flour across the blend", () => {
    const result = expectOk(
      baseInput({
        flourBlend: [
          { id: "bread", name: "Bread flour", percentage: 0.8 },
          { id: "semolina", name: "Semolina", percentage: 0.2 },
        ],
      })
    );

    expect(result.flourBlend).toHaveLength(2);
    expect(result.flourBlend[0].grams).toBeCloseTo(
      result.remainingFlourGrams * 0.8,
      8
    );
    expect(result.flourBlend[1].grams).toBeCloseTo(
      result.remainingFlourGrams * 0.2,
      8
    );

    const blendTotal = result.flourBlend.reduce((sum, f) => sum + f.grams, 0);
    expect(blendTotal).toBeCloseTo(result.remainingFlourGrams, 8);
  });

  it("matches total flour when there is no starter", () => {
    const result = expectOk(baseInput());
    expect(result.remainingFlourGrams).toBeCloseTo(result.totalFlourGrams, 10);
    expect(result.flourBlend[0].grams).toBeCloseTo(result.totalFlourGrams, 8);
  });
});

describe("sourdough starter accounting", () => {
  const sourdoughInput = baseInput({
    hydration: 0.65,
    malt: 0,
    sugar: 0,
    fatType: "none",
    fat: 0,
    leavening: {
      method: "sourdough",
      starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
    },
  });

  it("splits a 100% hydration starter evenly into flour and water", () => {
    const result = expectOk(sourdoughInput);
    const starter = result.starter;

    expect(starter).not.toBeNull();
    expect(starter?.weightGrams).toBeCloseTo(result.totalFlourGrams * 0.2, 8);
    // At 100% hydration the starter is half flour, half water.
    expect(starter?.flourGrams).toBeCloseTo(result.totalFlourGrams * 0.1, 8);
    expect(starter?.waterGrams).toBeCloseTo(result.totalFlourGrams * 0.1, 8);
    expect(starter?.flourGrams).toBeCloseTo(starter?.waterGrams ?? 0, 8);
  });

  it("subtracts starter flour from the flour still to be weighed", () => {
    const result = expectOk(sourdoughInput);

    expect(result.remainingFlourGrams).toBeCloseTo(
      result.totalFlourGrams * 0.9,
      8
    );
    expect(
      result.remainingFlourGrams + (result.starter?.flourGrams ?? 0)
    ).toBeCloseTo(result.totalFlourGrams, 8);
  });

  it("subtracts starter water from the water still to be weighed", () => {
    const result = expectOk(sourdoughInput);

    // 65% total water minus the 10% carried by the starter.
    expect(result.remainingWaterGrams).toBeCloseTo(
      result.totalFlourGrams * 0.55,
      8
    );
    expect(
      result.remainingWaterGrams + (result.starter?.waterGrams ?? 0)
    ).toBeCloseTo(result.totalWaterGrams, 8);
  });

  it("does not add the starter on top of the requested hydration", () => {
    const result = expectOk(sourdoughInput);
    expect(result.trueFinalHydration).toBeCloseTo(0.65, 10);
  });

  it("reports prefermented flour percentage", () => {
    const result = expectOk(sourdoughInput);
    expect(result.starter?.prefermentedFlourPercentage).toBeCloseTo(0.1, 10);
  });

  it("counts starter mass exactly once in the dough weight", () => {
    const result = expectOk(sourdoughInput);
    const summed = result.ingredients.reduce((t, i) => t + i.grams, 0);

    expect(summed).toBeCloseTo(result.totalDoughWeightGrams, 8);
  });

  it("handles a stiff 50% hydration starter", () => {
    const result = expectOk(
      baseInput({
        hydration: 0.65,
        malt: 0,
        sugar: 0,
        fatType: "none",
        fat: 0,
        leavening: {
          method: "sourdough",
          starter: { percentageOfTotalFlour: 0.2, hydration: 0.5 },
        },
      })
    );

    const starter = result.starter;
    // weight / (1 + 0.5) = two thirds flour, one third water.
    expect(starter?.flourGrams).toBeCloseTo(
      (starter?.weightGrams ?? 0) / 1.5,
      8
    );
    expect(starter?.waterGrams).toBeCloseTo((starter?.weightGrams ?? 0) / 3, 8);
    expect(result.trueFinalHydration).toBeCloseTo(0.65, 10);
  });
});

describe("hybrid dough", () => {
  const hybrid = baseInput({
    hydration: 0.65,
    malt: 0,
    sugar: 0,
    fatType: "none",
    fat: 0,
    leavening: {
      method: "hybrid",
      yeastType: "instant-dry",
      yeastPercentage: 0.001,
      starter: { percentageOfTotalFlour: 0.15, hydration: 1 },
    },
  });

  it("accounts for starter and commercial yeast together", () => {
    const result = expectOk(hybrid);

    expect(result.starter).not.toBeNull();
    const yeast = result.ingredients.find((i) => i.kind === "yeast");
    expect(yeast?.grams).toBeCloseTo(result.totalFlourGrams * 0.001, 8);
  });

  it("treats yeast as an added percentage but starter as part of the totals", () => {
    const result = expectOk(hybrid);

    // Starter flour and water come out of the totals.
    expect(result.remainingFlourGrams).toBeCloseTo(
      result.totalFlourGrams * 0.925,
      8
    );
    expect(result.trueFinalHydration).toBeCloseTo(0.65, 10);

    // And mass still balances with both leaveners present.
    const summed = result.ingredients.reduce((t, i) => t + i.grams, 0);
    expect(summed).toBeCloseTo(result.totalDoughWeightGrams, 8);
  });
});

describe("manual dough weight through the full engine", () => {
  it("respects the entered weight and reports derived loading", () => {
    const result = expectOk(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: 16,
          quantity: 2,
          selection: {
            mode: "manual-dough-weight",
            doughWeightPerUnitGrams: 600,
          },
        },
      })
    );

    expect(result.totalDoughWeightGrams).toBe(1200);
    expect(result.sizing.isLoadingDerived).toBe(true);
    expect(result.sizing.effectiveDoughLoadingGramsPerSquareInch).toBeCloseTo(
      2.9842,
      4
    );
    expect(result.totalFlourGrams).toBeCloseTo(1200 / 1.687, 8);
  });
});
