import { describe, expect, it } from "vitest";

import {
  createDoughFieldGeometry,
  createDoughFieldTransitionPlan,
  createRectangularFieldGeometry,
  createRoundFieldGeometry,
} from "../domain/dough-field-geometry";
import type { DoughFieldState } from "../components/dough-field";

const state: DoughFieldState = {
  shape: "round",
  diameterInches: 16,
  interiorLengthInches: 18,
  interiorWidthInches: 13,
  hydrationPercent: 63,
  doughLoadingGramsPerSquareInch: 2.8,
  totalDoughWeightGrams: 563,
  quantity: 1,
};

describe("Dough Field geometry", () => {
  it("generates round contours and diameter ticks", () => {
    const geometry = createRoundFieldGeometry(state);
    expect(geometry.contourPaths).toHaveLength(4);
    expect(geometry.guideLines).toHaveLength(16);
    expect(geometry.primaryLabel).toBe("Ø 16 IN");
  });
  it("generates rectangular contours and dimensions", () => {
    const geometry = createRectangularFieldGeometry({
      ...state,
      shape: "rectangular",
    });
    expect(geometry.contourPaths).toHaveLength(4);
    expect(geometry.primaryLabel).toBe("18 IN");
    expect(geometry.secondaryLabel).toBe("13 IN");
  });
  it("routes geometry by shape", () =>
    expect(
      createDoughFieldGeometry({ ...state, shape: "rectangular" }).shape
    ).toBe("rectangular"));
  it("uses the longer mode-transition plan", () =>
    expect(createDoughFieldTransitionPlan(false, true).morphMs).toBeGreaterThan(
      createDoughFieldTransitionPlan(false, false).morphMs
    ));
  it("returns final geometry immediately under reduced motion", () =>
    expect(createDoughFieldTransitionPlan(true, true)).toEqual({
      retractMs: 0,
      morphMs: 0,
      labelDelayMs: 0,
      settleMs: 0,
    }));
});
