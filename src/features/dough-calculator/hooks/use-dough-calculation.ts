"use client";

import { useEffect, useMemo } from "react";

import { calculateDough } from "../domain/calculate-dough";
import { BAKING_STEEL_PLUS, STEEL_PROFILES } from "../presets/equipment";
import { checkRoundSurfaceFit } from "../domain/warnings";
import {
  calculatorFormSchema,
  toDoughFormulaInput,
} from "../schemas/calculator-schema";
import type { DoughCalculation, ValidationIssue } from "../types/dough";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { readRecipeFromSearchParams } from "../utils/recipe-share";

/**
 * Derives the recipe from current inputs.
 *
 * The result is computed on read and memoised, never stored, so it cannot fall
 * out of step with the values it came from. This is also why the interface
 * needs no Calculate button.
 */
export function useDoughCalculation(): {
  calculation: DoughCalculation;
  fieldErrors: readonly ValidationIssue[];
  surfaceWarning: ValidationIssue | null;
} {
  const values = useCalculatorStore((state) => state.values);
  const surfaceId = useCalculatorStore((state) => state.surfaceId);

  return useMemo(() => {
    // Zod guards the shape of what the baker typed; the engine then guards the
    // relationships between those values.
    const parsed = calculatorFormSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: ValidationIssue[] = parsed.error.issues.map(
        (issue) => ({
          code: "invalid-input",
          severity: "error",
          message: issue.message,
          field: issue.path.join("."),
        })
      );

      return {
        calculation: { ok: false, issues: fieldErrors },
        fieldErrors,
        surfaceWarning: null,
      };
    }

    const calculation = calculateDough(toDoughFormulaInput(parsed.data));

    const profile =
      STEEL_PROFILES.find((candidate) => candidate.id === surfaceId) ??
      BAKING_STEEL_PLUS;

    const surfaceWarning =
      parsed.data.shape === "round" && surfaceId !== "custom"
        ? checkRoundSurfaceFit(parsed.data.diameterInches, profile)
        : null;

    return { calculation, fieldErrors: [], surfaceWarning };
  }, [values, surfaceId]);
}

/**
 * Rehydrates persisted interface preferences after mount.
 *
 * The store is created with `skipHydration`, so this is what actually reads
 * localStorage — on the client, after the first render has already matched the
 * server output.
 */
export function useCalculatorPersistence(): void {
  useEffect(() => {
    let active = true;
    void (async () => {
      await useCalculatorStore.persist.rehydrate();
      if (!active) return;
      useRecipeLibraryStore.getState().hydrate();

      const shared = readRecipeFromSearchParams(
        new URLSearchParams(window.location.search)
      );
      if (!shared) return;
      if (shared.ok) {
        useCalculatorStore.getState().applyRecipeDocument(shared.value);
        const library = useRecipeLibraryStore.getState();
        library.setActiveRecipeId(null);
        library.setWorkingName(shared.value.name);
        library.setInvalidShare(false);
        library.setStatusMessage(
          "Shared recipe loaded. It has not been saved to My Recipes."
        );
      } else {
        const library = useRecipeLibraryStore.getState();
        library.setInvalidShare(true);
        library.setStatusMessage(
          `${shared.message} Your current recipe was not changed.`
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);
}
