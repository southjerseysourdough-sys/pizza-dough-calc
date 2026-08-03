import { describe, expect, it } from "vitest";

import {
  formatArea,
  formatDoughLoading,
  formatFineGrams,
  formatIngredientGrams,
  formatPercentage,
  formatTotalWeight,
  formatWholeGrams,
} from "../utils/format";

/**
 * Display formatting only. These tests deliberately never touch the domain
 * engine, so a formatting change can never be mistaken for a formula change.
 */

describe("whole gram formatting", () => {
  it("rounds to the nearest gram", () => {
    expect(formatWholeGrams(333.712747)).toBe("334");
    expect(formatWholeGrams(210.2)).toBe("210");
  });

  it("handles non-finite input", () => {
    expect(formatWholeGrams(Number.NaN)).toBe("—");
  });
});

describe("fine gram formatting", () => {
  it("shows two decimals", () => {
    expect(formatFineGrams(0.667425)).toBe("0.67");
    expect(formatFineGrams(1.668564)).toBe("1.67");
  });

  it("shows a true zero as zero", () => {
    expect(formatFineGrams(0)).toBe("0");
  });

  it("never displays a positive quantity as zero", () => {
    expect(formatFineGrams(0.002)).toBe("<0.01");
    expect(formatFineGrams(0.0001)).toBe("<0.01");
    expect(formatFineGrams(0.004)).not.toBe("0.00");
    expect(formatFineGrams(0.004)).not.toBe("0");
  });

  it("rounds up into two decimals once large enough", () => {
    expect(formatFineGrams(0.006)).toBe("0.01");
  });
});

describe("ingredient formatting by kind", () => {
  it("uses fine precision for yeast", () => {
    expect(formatIngredientGrams(0.667425, "yeast")).toBe("0.67");
  });

  it("never rounds a positive yeast weight down to zero", () => {
    expect(formatIngredientGrams(0.002, "yeast")).toBe("<0.01");
    expect(formatIngredientGrams(0.002, "yeast")).not.toBe("0");
  });

  it("uses whole grams for flour and water", () => {
    expect(formatIngredientGrams(333.712747, "flour")).toBe("334");
    expect(formatIngredientGrams(210.23903, "water")).toBe("210");
  });

  it("falls back to fine precision for sub-gram amounts of any kind", () => {
    expect(formatIngredientGrams(0.4, "salt")).toBe("0.40");
  });
});

describe("percentage formatting", () => {
  it("renders whole percentages without decimals", () => {
    expect(formatPercentage(0.65)).toBe("65%");
    expect(formatPercentage(0.02)).toBe("2%");
  });

  it("renders fractional percentages with one decimal", () => {
    expect(formatPercentage(0.625)).toBe("62.5%");
  });

  it("handles non-finite input", () => {
    expect(formatPercentage(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("area, loading and total weight formatting", () => {
  it("formats area in square inches", () => {
    expect(formatArea(201.06193)).toBe("201.1 in²");
  });

  it("formats dough loading", () => {
    expect(formatDoughLoading(2.8)).toBe("2.80 g/in²");
  });

  it("formats grams below a kilogram", () => {
    expect(formatTotalWeight(562.973404)).toBe("563 g");
  });

  it("switches to kilograms for large batches", () => {
    expect(formatTotalWeight(1688.9202)).toBe("1.69 kg");
  });
});
