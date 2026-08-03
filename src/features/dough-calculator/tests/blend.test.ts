import { describe, expect, it } from "vitest";

import { normalizeFlourPercentages, sumPercentages } from "../utils/blend";

describe("normalizing a flour blend", () => {
  it("scales proportionally rather than splitting evenly", () => {
    const result = normalizeFlourPercentages([75, 25]);

    expect(result).toEqual([75, 25]);
  });

  it("preserves the ratio between rows", () => {
    // 3:1 must stay 3:1 after scaling up from 40 total.
    const result = normalizeFlourPercentages([30, 10]);

    expect(sumPercentages(result)).toBe(100);
    expect(result[0] / result[1]).toBeCloseTo(3, 10);
  });

  it("scales values that total more than 100 back down", () => {
    const result = normalizeFlourPercentages([120, 40]);

    expect(sumPercentages(result)).toBe(100);
    expect(result[0]).toBeCloseTo(75, 10);
    expect(result[1]).toBeCloseTo(25, 10);
  });

  it("totals exactly 100 for values that do not divide evenly", () => {
    const result = normalizeFlourPercentages([1, 1, 1]);

    // 33.33 x 3 = 99.99, so the remainder lands on one row.
    expect(sumPercentages(result)).toBe(100);
    expect(result).toHaveLength(3);
  });

  it("totals exactly 100 across many awkward rows", () => {
    for (const rows of [
      [1, 1, 1],
      [7, 3, 3, 3],
      [1, 2, 3, 4, 5, 6, 7],
    ]) {
      expect(sumPercentages(normalizeFlourPercentages(rows))).toBe(100);
    }
  });

  it("splits evenly only when every value is zero", () => {
    expect(normalizeFlourPercentages([0, 0])).toEqual([50, 50]);
    expect(sumPercentages(normalizeFlourPercentages([0, 0, 0]))).toBe(100);
  });

  it("ignores negative rows rather than letting them cancel others out", () => {
    const result = normalizeFlourPercentages([80, -20]);

    expect(sumPercentages(result)).toBe(100);
    expect(result[0]).toBe(100);
    expect(result[1]).toBe(0);
  });

  it("treats non-finite values as zero", () => {
    const result = normalizeFlourPercentages([Number.NaN, 50]);

    expect(sumPercentages(result)).toBe(100);
    expect(result[1]).toBe(100);
  });

  it("returns a single row at 100", () => {
    expect(normalizeFlourPercentages([42])).toEqual([100]);
  });

  it("handles an empty blend", () => {
    expect(normalizeFlourPercentages([])).toEqual([]);
  });

  it("is idempotent", () => {
    const once = normalizeFlourPercentages([30, 10, 5]);
    const twice = normalizeFlourPercentages(once);

    expect(twice).toEqual(once);
  });
});
