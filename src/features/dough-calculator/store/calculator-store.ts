"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PAN_PROFILES } from "../presets/equipment";
import { DEFAULT_PRESET, findPreset } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";
import type { CalculatorFormValues } from "../schemas/calculator-schema";
import {
  recipeInputToFormValues,
  type PizzaRecipeDocument,
} from "../domain/recipe-document";
import type { FermentationPlanInput } from "../domain/fermentation";

/**
 * Calculator state.
 *
 * Only source inputs live here. The calculated recipe and any validation
 * result are derived on read (see `use-dough-calculation.ts`) rather than
 * stored, so there is exactly one copy of every value and nothing can drift
 * out of sync.
 */

/** Which top-level format the interface is showing. */
export type CalculatorFormatMode = "round" | "sheet-pan";

type CalculatorState = {
  presetId: string;
  formatMode: CalculatorFormatMode;
  values: CalculatorFormValues;
  /** Selected surface, used only for fit guidance. */
  surfaceId: string;
  panProfileId: string;
  /** True once the baker confirms they measured the pan interior. */
  panInteriorMeasured: boolean;
  /** Progressive disclosure preference, persisted across visits. */
  showAdvanced: boolean;
  fermentationPlan?: FermentationPlanInput;
  fermentationWorkspaceOpen: boolean;
};

type CalculatorActions = {
  applyPreset: (presetId: string) => void;
  setFormatMode: (mode: CalculatorFormatMode) => void;
  setValues: (patch: Partial<CalculatorFormValues>) => void;
  setSurfaceId: (surfaceId: string) => void;
  setPanProfile: (panProfileId: string) => void;
  setPanInteriorMeasured: (measured: boolean) => void;
  setShowAdvanced: (showAdvanced: boolean) => void;
  setFermentationPlan: (plan: FermentationPlanInput | undefined) => void;
  setFermentationWorkspaceOpen: (open: boolean) => void;
  applyRecipeDocument: (document: PizzaRecipeDocument) => void;
  reset: () => void;
};

function initialState(): CalculatorState {
  return {
    presetId: DEFAULT_PRESET.id,
    formatMode:
      DEFAULT_PRESET.input.sizing.shape === "round" ? "round" : "sheet-pan",
    values: presetToFormValues(DEFAULT_PRESET),
    surfaceId: DEFAULT_PRESET.surface,
    panProfileId: DEFAULT_PRESET.panProfileId ?? "half-sheet-13x18",
    panInteriorMeasured: false,
    showAdvanced: false,
    fermentationPlan: undefined,
    fermentationWorkspaceOpen: false,
  };
}

export const useCalculatorStore = create<CalculatorState & CalculatorActions>()(
  persist(
    (set) => ({
      ...initialState(),

      applyPreset: (presetId) => {
        const preset = findPreset(presetId);
        if (!preset) return;

        set({
          presetId,
          values: presetToFormValues(preset),
          formatMode:
            preset.input.sizing.shape === "round" ? "round" : "sheet-pan",
          surfaceId: preset.surface,
          panProfileId: preset.panProfileId ?? "half-sheet-13x18",
          // A new pan means the previous measurement no longer applies.
          panInteriorMeasured: false,
        });
      },

      setFormatMode: (formatMode) =>
        set((state) => ({
          formatMode,
          values: {
            ...state.values,
            shape: formatMode === "round" ? "round" : "rectangular",
          },
        })),

      setValues: (patch) =>
        set((state) => ({ values: { ...state.values, ...patch } })),

      setSurfaceId: (surfaceId) => set({ surfaceId }),

      setPanProfile: (panProfileId) =>
        set((state) => {
          const profile = PAN_PROFILES.find((p) => p.id === panProfileId);
          if (!profile) return { panProfileId };

          // A profile with no dimensions of its own (Custom pan) must not wipe
          // whatever the baker has already entered and possibly measured.
          const hasOwnDimensions = profile.usableInteriorLengthInches > 0;

          return {
            panProfileId,
            values: hasOwnDimensions
              ? {
                  ...state.values,
                  usableInteriorLengthInches:
                    profile.usableInteriorLengthInches,
                  usableInteriorWidthInches: profile.usableInteriorWidthInches,
                }
              : state.values,
            // Switching to a different pan invalidates a measurement taken on
            // the previous one, unless the profile itself carries measured
            // dimensions. Keeping the flag for a Custom pan preserves a
            // measurement the baker just confirmed.
            panInteriorMeasured: hasOwnDimensions
              ? profile.isInteriorMeasured
              : state.panInteriorMeasured,
          };
        }),

      setPanInteriorMeasured: (panInteriorMeasured) =>
        set({ panInteriorMeasured }),

      setShowAdvanced: (showAdvanced) => set({ showAdvanced }),

      setFermentationPlan: (fermentationPlan) => set({ fermentationPlan }),

      setFermentationWorkspaceOpen: (fermentationWorkspaceOpen) =>
        set({ fermentationWorkspaceOpen }),

      applyRecipeDocument: (document) =>
        set({
          presetId: document.context.presetId,
          formatMode:
            document.calculatorInput.sizing.shape === "round"
              ? "round"
              : "sheet-pan",
          values: recipeInputToFormValues(document.calculatorInput),
          surfaceId: document.context.surfaceId,
          panProfileId: document.context.panProfileId,
          panInteriorMeasured: document.context.panInteriorMeasured,
          fermentationPlan: document.fermentationPlan,
        }),

      reset: () => set(initialState()),
    }),
    {
      name: "pdc:calculator",
      // Source input is a local draft. Calculated grams, warnings, validation
      // and recipe-library state remain derived or separately versioned.
      partialize: (state) => ({
        presetId: state.presetId,
        formatMode: state.formatMode,
        values: state.values,
        surfaceId: state.surfaceId,
        panProfileId: state.panProfileId,
        panInteriorMeasured: state.panInteriorMeasured,
        showAdvanced: state.showAdvanced,
        fermentationPlan: state.fermentationPlan,
      }),
      // Rehydration is deferred to an effect after mount. Reading
      // localStorage while the store is created would make the first client
      // render disagree with the server HTML.
      skipHydration: true,
    }
  )
);
