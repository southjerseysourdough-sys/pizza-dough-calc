"use client";

import { useEffect, useMemo } from "react";

import { calculateDough } from "../domain/calculate-dough";
import { BAKING_STEEL_PLUS, STEEL_PROFILES } from "../presets/equipment";
import { checkRoundSurfaceFit } from "../domain/warnings";
import {
  toDoughFormulaInput,
  validateCalculatorFormValues,
} from "../utils/form-values";
import type { DoughCalculation, ValidationIssue } from "../types/dough";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";

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
    const fieldErrors = validateCalculatorFormValues(values);

    if (fieldErrors.length > 0) {
      return {
        calculation: { ok: false, issues: fieldErrors },
        fieldErrors,
        surfaceWarning: null,
      };
    }

    const calculation = calculateDough(toDoughFormulaInput(values));

    const profile =
      STEEL_PROFILES.find((candidate) => candidate.id === surfaceId) ??
      BAKING_STEEL_PLUS;

    const surfaceWarning =
      values.shape === "round" && surfaceId !== "custom"
        ? checkRoundSurfaceFit(values.diameterInches, profile)
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
      try {
        await useCalculatorStore.persist.rehydrate();
      } catch {
        useCalculatorStore.getState().reset();
        useRecipeLibraryStore
          .getState()
          .setStatusMessage(
            "The saved draft could not be read, so only the active draft was reset. Saved recipes were left unchanged."
          );
      }
      if (!active) return;
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("r")) {
        const { readRecipeFromSearchParams } =
          await import("../utils/recipe-share");
        if (!active) return;
        const shared = readRecipeFromSearchParams(searchParams);
        if (shared?.ok) {
          useCalculatorStore.getState().applyRecipeDocument(shared.value);
          const library = useRecipeLibraryStore.getState();
          library.setActiveRecipeId(null);
          library.setWorkingName(shared.value.name);
          library.setInvalidShare(false);
          library.setStatusMessage(
            "Shared recipe loaded. It has not been saved to My Recipes."
          );
        } else if (shared) {
          const library = useRecipeLibraryStore.getState();
          library.setInvalidShare(true);
          library.setStatusMessage(
            `${shared.message} Your current recipe was not changed.`
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
}
