import { describe, expect, it } from "vitest";

import {
  calculateFermentationTimeline,
  applyFermentationTemplate,
  createBackwardFermentationTimeline,
  createDefaultFermentationPlan,
  createFermentationStageSources,
  createForwardFermentationTimeline,
  detectTimezoneOffsetChange,
  formatTimelineDuration,
  getCurrentTimezone,
  parseLocalAnchor,
  validateFermentationPlan,
} from "../domain/fermentation";
import { makeRecipeDocument } from "./recipe-fixtures";

function plan() {
  const document = makeRecipeDocument();
  return {
    document,
    plan: {
      ...createDefaultFermentationPlan(
        document.calculatorInput,
        document.context,
        new Date(2026, 7, 3, 10)
      ),
      anchorLocalDateTime: "2026-08-06T18:00",
    },
  };
}

describe("fermentation timeline", () => {
  it("anchors a forward schedule at mix time", () => {
    const { document, plan: source } = plan();
    const result = createForwardFermentationTimeline(
      source,
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.mixTimestamp).toBe(
      parseLocalAnchor(source.anchorLocalDateTime)
    );
  });

  it("anchors a backward schedule at bake time", () => {
    const { document, plan: source } = plan();
    const result = createBackwardFermentationTimeline(
      source,
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.bakeTimestamp).toBe(
      parseLocalAnchor(source.anchorLocalDateTime)
    );
  });

  it("always returns chronological stages", () => {
    const { document, plan: source } = plan();
    const result = calculateFermentationTimeline(
      source,
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.value.stages.every(
        (stage, index, stages) =>
          index === 0 || stage.startTimestamp >= stages[index - 1].endTimestamp
      )
    ).toBe(true);
  });

  it("crosses midnight and multiple dates without rounding drift", () => {
    const { document, plan: source } = plan();
    const result = calculateFermentationTimeline(
      {
        ...source,
        anchorLocalDateTime: "2026-08-06T00:15",
        coldFermentMinutes: 96 * 60,
      },
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Date(result.value.stages[0].startTimestamp).getDate()).not.toBe(
      new Date(result.value.bakeTimestamp).getDate()
    );
    expect(result.value.totalDurationMinutes).toBeGreaterThan(72 * 60);
  });

  it("supports schedules without cold fermentation or folds", () => {
    const { document, plan: source } = plan();
    const result = calculateFermentationTimeline(
      { ...source, coldFermentMinutes: 0, foldCount: 0 },
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    expect(
      result.ok &&
        result.value.stages.some((stage) => stage.type === "cold-ferment")
    ).toBe(false);
    expect(
      result.ok && result.value.stages.some((stage) => stage.type === "folds")
    ).toBe(false);
  });

  it("constructs round stages without panning", () => {
    const { document, plan: source } = plan();
    const types = createFermentationStageSources(
      source,
      document.calculatorInput
    ).map((stage) => stage.type);
    expect(types).toContain("ball");
    expect(types).not.toContain("pan");
  });

  it("provides editable same-day and hybrid template starting points", () => {
    const { document, plan: source } = plan();
    const sameDay = applyFermentationTemplate(
      "new-york-same-day",
      source,
      document.calculatorInput
    );
    expect(sameDay.coldFermentMinutes).toBe(0);
    expect(sameDay.roomBulkMinutes).toBeGreaterThan(0);
    const hybrid = applyFermentationTemplate(
      "hybrid-cold",
      source,
      document.calculatorInput
    );
    expect(hybrid.includeLevainPrep).toBe(true);
    expect(hybrid.coldFermentMinutes).toBeGreaterThan(0);
  });

  it("constructs sheet-pan stages without balling", () => {
    const { document, plan: source } = plan();
    const input = {
      ...document.calculatorInput,
      sizing: {
        shape: "rectangular" as const,
        usableInteriorLengthInches: 18,
        usableInteriorWidthInches: 13,
        quantity: 1,
        selection: {
          mode: "dough-loading" as const,
          doughLoadingGramsPerSquareInch: 4,
        },
      },
    };
    const types = createFermentationStageSources(
      { ...source, panMinutes: 15, finalProofMinutes: 90 },
      input
    ).map((stage) => stage.type);
    expect(types).toContain("pan");
    expect(types).toContain("final-proof");
    expect(types).not.toContain("ball");
  });

  it("includes user-controlled levain preparation for sourdough", () => {
    const { document, plan: source } = plan();
    const input = {
      ...document.calculatorInput,
      leavening: {
        method: "sourdough" as const,
        starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
      },
    };
    expect(
      createFermentationStageSources(
        { ...source, includeLevainPrep: true, levainPrepMinutes: 480 },
        input
      )[0].label
    ).toMatch(/levain|starter/i);
  });

  it("includes custom stages in both scheduling directions", () => {
    const { document, plan: source } = plan();
    const custom = {
      ...source,
      customStages: [
        {
          id: "custom-check",
          label: "Check dough strength",
          durationMinutes: 10,
          activeWork: true,
          position: "before-bake" as const,
        },
      ],
    };
    const forward = createForwardFermentationTimeline(
      custom,
      document.calculatorInput,
      0
    );
    const backward = createBackwardFermentationTimeline(
      custom,
      document.calculatorInput,
      0
    );
    expect(
      forward.ok &&
        forward.value.stages.some((stage) => stage.id === "custom-check")
    ).toBe(true);
    expect(
      backward.ok &&
        backward.value.stages.some((stage) => stage.id === "custom-check")
    ).toBe(true);
  });

  it("rejects negative durations, invalid anchors, folds, and duplicate custom ids", () => {
    const { plan: source } = plan();
    expect(
      validateFermentationPlan({ ...source, roomBulkMinutes: -1 }).ok
    ).toBe(false);
    expect(
      validateFermentationPlan({ ...source, anchorLocalDateTime: "nope" }).ok
    ).toBe(false);
    expect(
      validateFermentationPlan({
        ...source,
        foldCount: 1,
        foldIntervalMinutes: 0,
      }).ok
    ).toBe(false);
    const stage = {
      id: "same",
      label: "One",
      durationMinutes: 10,
      activeWork: false,
      position: "before-bake" as const,
    };
    expect(
      validateFermentationPlan({ ...source, customStages: [stage, stage] }).ok
    ).toBe(false);
  });

  it("warns without changing long or warm schedules", () => {
    const { document, plan: source } = plan();
    const result = calculateFermentationTimeline(
      {
        ...source,
        roomBulkMinutes: 13 * 60,
        warmUpMinutes: 7 * 60,
        refrigeratorTemperatureF: 45,
      },
      document.calculatorInput,
      0
    );
    expect(result.ok).toBe(true);
    expect(
      result.ok && result.value.advisories.map((item) => item.code)
    ).toEqual(
      expect.arrayContaining([
        "long-room-bulk",
        "long-warm-up",
        "warm-refrigerator",
      ])
    );
  });

  it("handles timezone identifiers and offset detection", () => {
    expect(getCurrentTimezone()).toBeTruthy();
    expect(
      detectTimezoneOffsetChange([
        {
          startTimestamp: new Date(2026, 0, 1).getTime(),
          endTimestamp: new Date(2026, 6, 1).getTime(),
        },
      ])
    ).toBe(
      new Date(2026, 0, 1).getTimezoneOffset() !==
        new Date(2026, 6, 1).getTimezoneOffset()
    );
    expect(formatTimelineDuration(3 * 1440 + 125)).toBe("3d 2h 5m");
  });
});
