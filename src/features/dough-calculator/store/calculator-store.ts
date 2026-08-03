"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PAN_PROFILES } from "../presets/equipment";
import { DEFAULT_PRESET, findPreset } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";
import type { CalculatorFormValues } from "../schemas/calculator-schema";

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
};

type CalculatorActions = {
  applyPreset: (presetId: string) => void;
  setFormatMode: (mode: CalculatorFormatMode) => void;
  setValues: (patch: Partial<CalculatorFormValues>) => void;
  setSurfaceId: (surfaceId: string) => void;
  setPanProfile: (panProfileId: string) => void;
  setPanInteriorMeasured: (measured: boolean) => void;
  setShowAdvanced: (showAdvanced: boolean) => void;
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

      reset: () => set(initialState()),
    }),
    {
      name: "pdc:calculator",
      // Only a durable interface preference is persisted. Inputs and any
      // validation state stay in memory so a reload starts from the preset.
      partialize: (state) => ({ showAdvanced: state.showAdvanced }),
      // Rehydration is deferred to an effect after mount. Reading
      // localStorage while the store is created would make the first client
      // render disagree with the server HTML.
      skipHydration: true,
    }
  )
);
