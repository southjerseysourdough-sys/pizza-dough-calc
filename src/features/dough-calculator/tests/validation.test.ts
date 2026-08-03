import { describe, expect, it } from "vitest";

import { calculateDough } from "../domain/calculate-dough";
import { checkYeastWeighability } from "../domain/warnings";
import { NEW_YORK_ON_STEEL } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";
import {
  calculatorFormSchema,
  type CalculatorFormValues,
} from "../schemas/calculator-schema";
import type { DoughFormulaInput } from "../types/dough";

/** A known-good form payload, used to isolate one field per assertion. */
function validFormValues(): CalculatorFormValues {
  return presetToFormValues(NEW_YORK_ON_STEEL);
}

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
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.002,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
    ...overrides,
  };
  return input;
}

function issueCodes(input: DoughFormulaInput): string[] {
  const calculation = calculateDough(input);
  return calculation.ok ? [] : calculation.issues.map((issue) => issue.code);
}

describe("invalid flour blend", () => {
  it("rejects a blend that does not total 100%", () => {
    const codes = issueCodes(
      baseInput({
        flourBlend: [
          { id: "a", name: "Bread flour", percentage: 0.5 },
          { id: "b", name: "Semolina", percentage: 0.3 },
        ],
      })
    );

    expect(codes).toContain("flour-blend-total");
  });

  it("accepts a blend inside the documented tolerance", () => {
    const calculation = calculateDough(
      baseInput({
        flourBlend: [
          { id: "a", name: "A", percentage: 0.333 },
          { id: "b", name: "B", percentage: 0.333 },
          { id: "c", name: "C", percentage: 0.334 },
        ],
      })
    );

    expect(calculation.ok).toBe(true);
  });

  it("accepts an empty blend as one unspecified flour", () => {
    expect(calculateDough(baseInput({ flourBlend: [] })).ok).toBe(true);
  });

  it("rejects a negative blend percentage", () => {
    const codes = issueCodes(
      baseInput({
        flourBlend: [
          { id: "a", name: "A", percentage: 1.2 },
          { id: "b", name: "B", percentage: -0.2 },
        ],
      })
    );

    expect(codes).toContain("negative-value");
  });
});

describe("invalid pan dimensions", () => {
  it("rejects a zero usable interior width", () => {
    const codes = issueCodes(
      baseInput({
        sizing: {
          shape: "rectangular",
          usableInteriorLengthInches: 18,
          usableInteriorWidthInches: 0,
          quantity: 1,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 4.5,
          },
        },
      })
    );

    expect(codes).toContain("not-positive");
  });

  it("rejects a negative usable interior length", () => {
    const codes = issueCodes(
      baseInput({
        sizing: {
          shape: "rectangular",
          usableInteriorLengthInches: -18,
          usableInteriorWidthInches: 13,
          quantity: 1,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 4.5,
          },
        },
      })
    );

    expect(codes).toContain("not-positive");
  });

  it("rejects a zero diameter", () => {
    const codes = issueCodes(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: 0,
          quantity: 1,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 2.8,
          },
        },
      })
    );

    expect(codes).toContain("not-positive");
  });

  it("rejects zero quantity", () => {
    const codes = issueCodes(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: 16,
          quantity: 0,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 2.8,
          },
        },
      })
    );

    expect(codes).toContain("not-positive");
  });

  it("rejects non-finite values", () => {
    const codes = issueCodes(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: Number.NaN,
          quantity: 1,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 2.8,
          },
        },
      })
    );

    expect(codes).toContain("not-finite");
  });
});

describe("invalid percentages", () => {
  it("rejects hydration at zero", () => {
    expect(issueCodes(baseInput({ hydration: 0 }))).toContain("not-positive");
  });

  it("rejects negative salt", () => {
    expect(issueCodes(baseInput({ salt: -0.01 }))).toContain("negative-value");
  });

  it("rejects a negative custom ingredient percentage", () => {
    const codes = issueCodes(
      baseInput({
        customIngredients: [{ id: "x", name: "Mystery", percentage: -0.05 }],
      })
    );

    expect(codes).toContain("negative-value");
  });
});

describe("invalid starter contribution", () => {
  it("rejects starter hydration at zero", () => {
    const codes = issueCodes(
      baseInput({
        leavening: {
          method: "sourdough",
          starter: { percentageOfTotalFlour: 0.2, hydration: 0 },
        },
      })
    );

    expect(codes).toContain("not-positive");
  });

  it("rejects a starter carrying more flour than the formula", () => {
    const codes = issueCodes(
      baseInput({
        leavening: {
          method: "sourdough",
          // 250% starter at 50% hydration means starter flour alone is
          // 250 / 1.5 = 167% of total flour.
          starter: { percentageOfTotalFlour: 2.5, hydration: 0.5 },
        },
      })
    );

    expect(codes).toContain("starter-flour-exceeds-total");
  });

  it("rejects a starter carrying more water than the formula's total", () => {
    const codes = issueCodes(
      baseInput({
        // Low dough hydration with a large, wet starter: starter water is
        // 0.9 / 2 = 45% of flour, above the 30% total water.
        hydration: 0.3,
        leavening: {
          method: "sourdough",
          starter: { percentageOfTotalFlour: 0.9, hydration: 1 },
        },
      })
    );

    expect(codes).toContain("starter-water-exceeds-total");
  });

  it("accepts a starter that fits inside the formula", () => {
    const calculation = calculateDough(
      baseInput({
        hydration: 0.65,
        leavening: {
          method: "sourdough",
          starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
        },
      })
    );

    expect(calculation.ok).toBe(true);
  });
});

describe("advisory warnings rather than errors", () => {
  it("allows very high hydration but warns", () => {
    const calculation = calculateDough(baseInput({ hydration: 0.95 }));

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.warnings.map((w) => w.code)).toContain(
      "high-hydration"
    );
  });

  it("allows very low hydration but warns", () => {
    const calculation = calculateDough(baseInput({ hydration: 0.45 }));

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.warnings.map((w) => w.code)).toContain(
      "low-hydration"
    );
  });

  it("allows high salt but warns", () => {
    const calculation = calculateDough(baseInput({ salt: 0.05 }));

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.warnings.map((w) => w.code)).toContain(
      "high-salt"
    );
  });

  function warningCodes(input: DoughFormulaInput): string[] {
    const calculation = calculateDough(input);
    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return [];
    return calculation.result.warnings.map((w) => w.code);
  }

  function roundAt(loading: number): DoughFormulaInput {
    return baseInput({
      sizing: {
        shape: "round",
        diameterInches: 16,
        quantity: 1,
        selection: {
          mode: "dough-loading",
          doughLoadingGramsPerSquareInch: loading,
        },
      },
    });
  }

  function rectangularAt(loading: number): DoughFormulaInput {
    return baseInput({
      sizing: {
        shape: "rectangular",
        usableInteriorLengthInches: 18,
        usableInteriorWidthInches: 13,
        quantity: 1,
        selection: {
          mode: "dough-loading",
          doughLoadingGramsPerSquareInch: loading,
        },
      },
    });
  }

  it("warns above 4.5 g/in² for a round pizza", () => {
    expect(warningCodes(roundAt(5))).toContain("high-dough-loading");
  });

  it("stays quiet at or below 4.5 g/in² for a round pizza", () => {
    expect(warningCodes(roundAt(4.5))).not.toContain("high-dough-loading");
    expect(warningCodes(roundAt(2.8))).not.toContain("high-dough-loading");
  });

  it("does not apply the round threshold to a sheet pan", () => {
    // 5 g/in² would warn on a round pizza but is ordinary in a pan.
    const codes = warningCodes(rectangularAt(5));
    expect(codes).not.toContain("high-dough-loading");
    expect(codes).not.toContain("heavy-pan-dough");
  });

  it("gives an informational note above 6.5 g/in² in a pan", () => {
    const calculation = calculateDough(rectangularAt(7));
    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;

    const issue = calculation.result.warnings.find(
      (w) => w.code === "heavy-pan-dough"
    );
    expect(issue).toBeDefined();
    // Informational, not a warning: a thick pan pizza is the point.
    expect(issue?.severity).toBe("info");
  });

  it("stays quiet at or below 6.5 g/in² in a pan", () => {
    expect(warningCodes(rectangularAt(6.5))).not.toContain("heavy-pan-dough");
  });

  it("never lets an advisory change the formula", () => {
    const quiet = calculateDough(rectangularAt(6.5));
    const noisy = calculateDough(rectangularAt(7));
    expect(quiet.ok && noisy.ok).toBe(true);
    if (!quiet.ok || !noisy.ok) return;

    // Same loading maths either side of the threshold; only the advice differs.
    expect(noisy.result.totalDoughWeightGrams).toBeCloseTo(234 * 7, 8);
    expect(quiet.result.totalDoughWeightGrams).toBeCloseTo(234 * 6.5, 8);
  });
});

describe("reserved custom ingredient names", () => {
  it("rejects names the formula already tracks", () => {
    for (const name of ["Flour", "water", "SALT", "Yeast", " starter "]) {
      const result = calculatorFormSchema.safeParse({
        ...validFormValues(),
        customIngredients: [{ id: "x", name, percentage: 2 }],
      });
      expect(result.success, `expected "${name}" to be rejected`).toBe(false);
    }
  });

  it("allows reasonable names that merely contain a reserved word", () => {
    for (const name of [
      "Milk Powder",
      "Parmesan",
      "Poolish Salt",
      "Herbs",
      "Garlic",
      "Vital Wheat Gluten",
    ]) {
      const result = calculatorFormSchema.safeParse({
        ...validFormValues(),
        customIngredients: [{ id: "x", name, percentage: 2 }],
      });
      expect(result.success, `expected "${name}" to be allowed`).toBe(true);
    }
  });
});

describe("yeast weighability", () => {
  it("warns when a positive yeast weight is below scale resolution", () => {
    const issue = checkYeastWeighability(0.04);

    expect(issue).not.toBeNull();
    expect(issue?.code).toBe("yeast-below-scale-resolution");
    expect(issue?.severity).toBe("warning");
  });

  it("stays silent at or above the resolution threshold", () => {
    expect(checkYeastWeighability(0.1)).toBeNull();
    expect(checkYeastWeighability(1.2)).toBeNull();
  });

  it("stays silent when there is genuinely no yeast", () => {
    expect(checkYeastWeighability(0)).toBeNull();
  });

  it("does not change the formula to make yeast easier to weigh", () => {
    const calculation = calculateDough(
      baseInput({
        sizing: {
          shape: "round",
          diameterInches: 8,
          quantity: 1,
          selection: {
            mode: "dough-loading",
            doughLoadingGramsPerSquareInch: 2.3,
          },
        },
        leavening: {
          method: "commercial-yeast",
          yeastType: "instant-dry",
          yeastPercentage: 0.0002,
        },
      })
    );

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;

    const yeast = calculation.result.ingredients.find(
      (i) => i.kind === "yeast"
    );
    // The raw value stays exactly as the percentage dictates.
    expect(yeast?.grams).toBeCloseTo(
      calculation.result.totalFlourGrams * 0.0002,
      10
    );
    expect(yeast?.grams).toBeGreaterThan(0);
    expect(calculation.result.warnings.map((w) => w.code)).toContain(
      "yeast-below-scale-resolution"
    );
  });
});
