import { describe, expect, it } from "vitest";

import {
  calculateRectangularArea,
  calculateRoundArea,
  calculateSizing,
} from "../domain/sizing";
import { BAKING_STEEL_PLUS } from "../presets/equipment";
import { checkRoundSurfaceFit } from "../domain/warnings";
import type { SizingInput } from "../types/dough";

describe("round area", () => {
  it("uses pi r squared", () => {
    expect(calculateRoundArea(16)).toBeCloseTo(Math.PI * 64, 10);
  });

  it("computes a 16 inch pizza as about 201.06 square inches", () => {
    expect(calculateRoundArea(16)).toBeCloseTo(201.0619, 4);
  });

  it("scales with the square of the diameter", () => {
    expect(calculateRoundArea(20) / calculateRoundArea(10)).toBeCloseTo(4, 10);
  });
});

describe("rectangular usable area", () => {
  it("multiplies the measured interior dimensions", () => {
    expect(calculateRectangularArea(17.25, 12.25)).toBeCloseTo(211.3125, 10);
  });

  it("uses measured interior values rather than nominal ones", () => {
    const nominal = calculateRectangularArea(18, 13);
    const measured = calculateRectangularArea(17.25, 12.25);
    expect(measured).toBeLessThan(nominal);
  });
});

describe("dough loading sizing", () => {
  const roundInput = (quantity: number): SizingInput => ({
    shape: "round",
    diameterInches: 16,
    quantity,
    selection: { mode: "dough-loading", doughLoadingGramsPerSquareInch: 2.8 },
  });

  it("calculates one 16 inch pizza", () => {
    const sizing = calculateSizing(roundInput(1));

    expect(sizing.areaPerUnitSquareInches).toBeCloseTo(201.0619, 4);
    expect(sizing.doughWeightPerUnitGrams).toBeCloseTo(562.973, 3);
    expect(sizing.totalDoughWeightGrams).toBeCloseTo(562.973, 3);
    expect(sizing.isLoadingDerived).toBe(false);
  });

  it("multiplies by quantity for three 16 inch pizzas", () => {
    const one = calculateSizing(roundInput(1));
    const three = calculateSizing(roundInput(3));

    expect(three.doughWeightPerUnitGrams).toBeCloseTo(
      one.doughWeightPerUnitGrams,
      10
    );
    expect(three.totalDoughWeightGrams).toBeCloseTo(
      one.totalDoughWeightGrams * 3,
      10
    );
    // 201.06193 in² x 2.8 g/in² x 3 = 1688.9202 g.
    expect(three.totalDoughWeightGrams).toBeCloseTo(1688.9202, 4);
  });

  it("calculates a Sicilian pan from entered interior dimensions", () => {
    const sizing = calculateSizing({
      shape: "rectangular",
      usableInteriorLengthInches: 17.25,
      usableInteriorWidthInches: 12.25,
      quantity: 1,
      selection: { mode: "dough-loading", doughLoadingGramsPerSquareInch: 4.5 },
    });

    expect(sizing.areaPerUnitSquareInches).toBeCloseTo(211.3125, 10);
    expect(sizing.doughWeightPerUnitGrams).toBeCloseTo(950.906, 3);
  });

  it("calculates a grandma pan from entered interior dimensions", () => {
    const sizing = calculateSizing({
      shape: "rectangular",
      usableInteriorLengthInches: 17.25,
      usableInteriorWidthInches: 12.25,
      quantity: 1,
      selection: { mode: "dough-loading", doughLoadingGramsPerSquareInch: 3.4 },
    });

    expect(sizing.doughWeightPerUnitGrams).toBeCloseTo(718.4625, 4);
  });
});

describe("manual dough weight override", () => {
  it("respects the entered weight exactly", () => {
    const sizing = calculateSizing({
      shape: "round",
      diameterInches: 16,
      quantity: 2,
      selection: { mode: "manual-dough-weight", doughWeightPerUnitGrams: 600 },
    });

    expect(sizing.doughWeightPerUnitGrams).toBe(600);
    expect(sizing.totalDoughWeightGrams).toBe(1200);
  });

  it("derives the effective loading and flags it as derived", () => {
    const sizing = calculateSizing({
      shape: "round",
      diameterInches: 16,
      quantity: 1,
      selection: { mode: "manual-dough-weight", doughWeightPerUnitGrams: 600 },
    });

    expect(sizing.isLoadingDerived).toBe(true);
    expect(sizing.effectiveDoughLoadingGramsPerSquareInch).toBeCloseTo(
      600 / (Math.PI * 64),
      10
    );
    expect(sizing.effectiveDoughLoadingGramsPerSquareInch).toBeCloseTo(
      2.9842,
      4
    );
  });

  it("round trips against dough loading mode", () => {
    const loading = calculateSizing({
      shape: "round",
      diameterInches: 14,
      quantity: 1,
      selection: { mode: "dough-loading", doughLoadingGramsPerSquareInch: 2.6 },
    });

    const manual = calculateSizing({
      shape: "round",
      diameterInches: 14,
      quantity: 1,
      selection: {
        mode: "manual-dough-weight",
        doughWeightPerUnitGrams: loading.doughWeightPerUnitGrams,
      },
    });

    expect(manual.effectiveDoughLoadingGramsPerSquareInch).toBeCloseTo(2.6, 10);
  });
});

describe("Baking Steel Plus fit warning", () => {
  it("publishes the manufacturer dimensions", () => {
    expect(BAKING_STEEL_PLUS.widthInches).toBe(20);
    expect(BAKING_STEEL_PLUS.depthInches).toBe(15);
    expect(BAKING_STEEL_PLUS.thicknessInches).toBe(0.25);
    expect(BAKING_STEEL_PLUS.weightPounds).toBe(22);
  });

  it("warns for a 16 inch pizza, since the short side is 15 inches", () => {
    const issue = checkRoundSurfaceFit(16, BAKING_STEEL_PLUS);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe("warning");
    expect(issue?.code).toBe("surface-fit");
  });

  it("does not warn for a 14 inch pizza", () => {
    expect(checkRoundSurfaceFit(14, BAKING_STEEL_PLUS)).toBeNull();
  });

  it("does not warn at exactly the short side", () => {
    expect(checkRoundSurfaceFit(15, BAKING_STEEL_PLUS)).toBeNull();
  });

  it("stays silent for surfaces with no published dimensions", () => {
    expect(
      checkRoundSurfaceFit(18, {
        id: "standard-steel",
        name: "Other baking steel",
        widthInches: 0,
        depthInches: 0,
        thicknessInches: 0,
        weightPounds: 0,
        description: "",
      })
    ).toBeNull();
  });
});
