import { describe, expect, it } from "vitest";

import { calculateDough } from "../domain/calculate-dough";
import { createFormulaSignatureData } from "../domain/formula-signature";
import {
  areRecipeDocumentsEquivalent,
  normalizeRecipeInput,
} from "../utils/recipe-normalization";
import {
  formatRecipeAsPlainText,
  sanitizeRecipeFilename,
} from "../utils/recipe-format";
import {
  createRecipePresentationModel,
  presentationMassTotal,
} from "../utils/recipe-presentation";
import { makeRecipeDocument } from "./recipe-fixtures";
import { createDefaultFermentationPlan } from "../domain/fermentation";

describe("recipe presentation and identity", () => {
  it("creates deterministic formula signatures", () => {
    const input = makeRecipeDocument().calculatorInput;
    expect(createFormulaSignatureData(input)).toEqual(
      createFormulaSignatureData(input)
    );
  });
  it("changes a signature for meaningful formula changes", () => {
    const input = makeRecipeDocument().calculatorInput;
    expect(
      createFormulaSignatureData({
        ...input,
        hydration: input.hydration + 0.05,
      })
    ).not.toEqual(createFormulaSignatureData(input));
  });
  it("normalizes away generated row identifiers", () => {
    const input = makeRecipeDocument().calculatorInput;
    const changed = {
      ...input,
      flourBlend: input.flourBlend.map((flour) => ({
        ...flour,
        id: "different",
      })),
    };
    expect(normalizeRecipeInput(changed)).toEqual(normalizeRecipeInput(input));
  });
  it("recognizes equivalent documents", () => {
    const left = makeRecipeDocument();
    expect(areRecipeDocumentsEquivalent(left, structuredClone(left))).toBe(
      true
    );
  });
  it("recognizes modified input", () => {
    const left = makeRecipeDocument();
    const right = {
      ...left,
      calculatorInput: { ...left.calculatorInput, hydration: 0.7 },
    };
    expect(areRecipeDocumentsEquivalent(left, right)).toBe(false);
  });
  it("formats a readable recipe without a Markdown table", () => {
    const result = createRecipePresentationModel(makeRecipeDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const text = formatRecipeAsPlainText(result.value);
    expect(text).toContain("MAIN DOUGH");
    expect(text).toContain("South Jersey Sourdough");
    expect(text).not.toContain("| ---");
  });
  it("sanitizes JSON filenames", () =>
    expect(sanitizeRecipeFilename("Three Day / New York!", "json")).toBe(
      "three-day-new-york.json"
    ));
  it("sanitizes PDF filenames", () =>
    expect(sanitizeRecipeFilename("Grandma’s Pizza", "pdf")).toBe(
      "grandmas-pizza.pdf"
    ));
  it("accounts for presentation mass once", () => {
    const result = createRecipePresentationModel(makeRecipeDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(presentationMassTotal(result.value)).toBeCloseTo(
      result.value.totalDoughWeightGrams,
      6
    );
  });
  it("does not double count starter flour or water", () => {
    const original = makeRecipeDocument();
    const document = {
      ...original,
      calculatorInput: {
        ...original.calculatorInput,
        leavening: {
          method: "sourdough" as const,
          starter: { percentageOfTotalFlour: 0.2, hydration: 1 },
        },
      },
    };
    const calculation = calculateDough(document.calculatorInput);
    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    const weighed = calculation.result.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.grams,
      0
    );
    expect(weighed).toBeCloseTo(calculation.result.totalDoughWeightGrams, 6);
  });
  it("creates one shared presentation model for print and PDF consumers", () => {
    const first = createRecipePresentationModel(makeRecipeDocument());
    const second = createRecipePresentationModel(makeRecipeDocument());
    expect(first).toEqual(second);
  });
  it("includes a fermentation schedule in presentation and plain text", () => {
    const base = makeRecipeDocument();
    const document = {
      ...base,
      fermentationPlan: {
        ...createDefaultFermentationPlan(
          base.calculatorInput,
          base.context,
          new Date(2026, 7, 3)
        ),
        anchorLocalDateTime: "2026-08-06T18:00",
      },
    };
    const result = createRecipePresentationModel(document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.schedule?.stages.length).toBeGreaterThan(0);
    expect(formatRecipeAsPlainText(result.value)).toMatch(
      /FERMENTATION PLAN[\s\S]*Judge the dough/i
    );
  });
});
