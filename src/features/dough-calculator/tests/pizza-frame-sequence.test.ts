import { describe, expect, it } from "vitest";

import {
  PIZZA_FRAME_COUNT,
  clampPizzaFrame,
  interpolatePizzaFrame,
  pizzaFramePosition,
} from "../domain/pizza-frame-sequence";

describe("pizza frame sequence", () => {
  it("maps the first and final frames to opposite sprite corners", () => {
    expect(pizzaFramePosition(0)).toEqual({
      frame: 0,
      xPercent: 0,
      yPercent: 0,
    });
    expect(pizzaFramePosition(PIZZA_FRAME_COUNT - 1)).toEqual({
      frame: 29,
      xPercent: 100,
      yPercent: 100,
    });
  });

  it("clamps invalid frame positions", () => {
    expect(clampPizzaFrame(-5)).toBe(0);
    expect(clampPizzaFrame(200)).toBe(29);
  });

  it("interpolates in either direction", () => {
    expect(interpolatePizzaFrame(0, 29, 0)).toBe(0);
    expect(interpolatePizzaFrame(0, 29, 1)).toBe(29);
    expect(interpolatePizzaFrame(29, 0, 0)).toBe(29);
    expect(interpolatePizzaFrame(29, 0, 1)).toBe(0);
    expect(interpolatePizzaFrame(0, 29, 0.5)).toBeGreaterThan(0);
  });
});
