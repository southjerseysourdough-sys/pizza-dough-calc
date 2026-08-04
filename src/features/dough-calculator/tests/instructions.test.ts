import { describe, expect, it } from "vitest";

import { createBakingInstructions } from "../domain/instructions";
import { makeRecipeDocument } from "./recipe-fixtures";

const text = (
  document: ReturnType<typeof makeRecipeDocument>,
  stage: Parameters<typeof createBakingInstructions>[1]
) =>
  createBakingInstructions(document, stage)
    .instructions.map(
      (instruction) => `${instruction.title} ${instruction.detail}`
    )
    .join(" ");

describe("context-aware baking instructions", () => {
  it("adapts round-steel shaping and baking guidance", () => {
    const document = makeRecipeDocument();
    expect(text(document, "shape")).toMatch(/bench flour|rim gas/i);
    expect(text(document, "bake")).toMatch(/bottom browning|broiler/i);
  });

  it("adapts sheet-pan preparation and doneness", () => {
    const document = makeRecipeDocument();
    const pan = {
      ...document,
      calculatorInput: {
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
      },
    };
    expect(text(pan, "pan")).toMatch(/oil|corners|rest/i);
    expect(text(pan, "bake")).toMatch(/edge color|bottom/i);
  });

  it("describes sourdough readiness and hybrid activity", () => {
    const document = makeRecipeDocument();
    const sourdough = {
      ...document,
      calculatorInput: {
        ...document.calculatorInput,
        leavening: {
          method: "sourdough" as const,
          starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
        },
      },
    };
    expect(text(sourdough, "ingredient-prep")).toMatch(/ripe|active starter/i);
    expect(
      createBakingInstructions(sourdough, "room-bulk").observation
    ).toMatch(/starter strength/i);
    const hybrid = {
      ...sourdough,
      calculatorInput: {
        ...sourdough.calculatorInput,
        leavening: {
          method: "hybrid" as const,
          yeastType: "instant-dry" as const,
          yeastPercentage: 0.001,
          starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
        },
      },
    };
    expect(text(hybrid, "mix")).toMatch(/both systems are active/i);
  });

  it("handles tallow differently from liquid oil", () => {
    const document = makeRecipeDocument();
    const tallow = {
      ...document,
      calculatorInput: {
        ...document.calculatorInput,
        fatType: "tallow" as const,
        fat: 0.03,
      },
    };
    expect(text(tallow, "mix")).toMatch(/softened|melted.*cooled/i);
  });

  it("adapts high and lower hydration handling", () => {
    const document = makeRecipeDocument();
    const high = {
      ...document,
      calculatorInput: { ...document.calculatorInput, hydration: 0.75 },
    };
    const low = {
      ...document,
      calculatorInput: { ...document.calculatorInput, hydration: 0.55 },
    };
    expect(text(high, "folds")).toMatch(/wet|oiled hands|preserve gas/i);
    expect(text(low, "mix")).toMatch(/develop enough strength|extra flour/i);
  });
});
