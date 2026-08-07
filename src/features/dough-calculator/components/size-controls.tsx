"use client";

import { useState } from "react";
import { AlertTriangleIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  MEASURE_PAN_INTERIOR_NOTICE,
  PAN_PROFILES,
  STEEL_PROFILES,
} from "../presets/equipment";
import { ROUND_SIZE_PRESETS } from "../presets/sizes";
import { useCalculatorStore } from "../store/calculator-store";
import { calculateRoundArea } from "../domain/sizing";
import { formatTotalWeight } from "../utils/format";
import { NumericField } from "./numeric-field";
import { ContextHelp } from "./context-help";
import { ChoiceChips } from "./step-section";

/**
 * Size and equipment controls for both formats.
 *
 * The basic path is one decision: which standard size. Everything that adjusts
 * the *thickness* of that size — dough loading, an exact ball weight, a
 * surface fit check — is precision work and lives behind the advanced toggle.
 *
 * Equipment selection only drives fit guidance — changing a surface or pan
 * never rewrites a formula value.
 */

const CUSTOM_DIAMETER = -1;

export function SizeControls() {
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const surfaceId = useCalculatorStore((state) => state.surfaceId);
  const setSurfaceId = useCalculatorStore((state) => state.setSurfaceId);
  const panProfileId = useCalculatorStore((state) => state.panProfileId);
  const setPanProfile = useCalculatorStore((state) => state.setPanProfile);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);
  const panInteriorMeasured = useCalculatorStore(
    (state) => state.panInteriorMeasured
  );
  const setPanInteriorMeasured = useCalculatorStore(
    (state) => state.setPanInteriorMeasured
  );

  const isRound = values.shape === "round";
  const isManual = values.sizingMode === "manual-dough-weight";

  // Choosing Custom is a stated intent, not something to infer from the
  // number: 16 is still a custom choice if the baker asked to type it. A
  // diameter that matches no chip forces the field open regardless, so a
  // recipe loaded at 15" arrives with its own control already visible.
  const [wantsCustomSize, setWantsCustomSize] = useState(false);
  const matchedSize = ROUND_SIZE_PRESETS.find(
    (size) => size.diameterInches === values.diameterInches
  );
  const showCustomDiameter = wantsCustomSize || !matchedSize;

  return (
    <div className="flex flex-col gap-5">
      {isRound ? (
        <>
          <ChoiceChips
            name="pizza-size"
            legend="Pizza size"
            value={
              showCustomDiameter
                ? CUSTOM_DIAMETER
                : (matchedSize?.diameterInches ?? CUSTOM_DIAMETER)
            }
            options={[
              ...ROUND_SIZE_PRESETS.map((size) => ({
                value: size.diameterInches,
                label: size.label,
                // The weight each size actually produces under the chosen
                // dough style, so "16 inch" and "480 g" are never two
                // separate things to look up — and never disagree once the
                // style changes the loading.
                detail: isManual
                  ? undefined
                  : formatTotalWeight(
                      calculateRoundArea(size.diameterInches) *
                        values.doughLoadingGramsPerSquareInch
                    ),
              })),
              { value: CUSTOM_DIAMETER, label: "Custom", detail: "Any size" },
            ]}
            onChange={(diameterInches) => {
              if (diameterInches === CUSTOM_DIAMETER) {
                setWantsCustomSize(true);
                return;
              }
              setWantsCustomSize(false);
              setValues({ diameterInches });
            }}
          />

          {showCustomDiameter ? (
            <NumericField
              label="Pizza diameter"
              unit="in"
              value={values.diameterInches}
              min={6}
              max={20}
              step={0.5}
              hint="Dough scales with area, so the crust stays the same thickness."
              onChange={(diameterInches) => setValues({ diameterInches })}
            />
          ) : null}
        </>
      ) : (
        <>
          <ChoiceChips
            name="pan-size"
            legend="Pan"
            value={panProfileId}
            options={PAN_PROFILES.map((profile) => ({
              value: profile.id,
              label: profile.shortName,
              detail:
                profile.nominalLengthInches > 0
                  ? `${profile.nominalWidthInches}″ × ${profile.nominalLengthInches}″`
                  : "Measure it",
            }))}
            onChange={setPanProfile}
          />

          {/*
           * Until the baker confirms a measurement, the dimensions are only
           * the nominal size and are labelled as such. Calculations run
           * either way — we simply do not claim a precision we do not have.
           */}
          {panInteriorMeasured ? null : (
            <div className="flex items-start gap-2.5 rounded-lg bg-warning-surface/60 px-3 py-2.5 ring-1 ring-warning/25">
              <AlertTriangleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-warning"
              />
              <p className="text-xs text-foreground">
                <span className="font-medium">Estimated dimensions. </span>
                {MEASURE_PAN_INTERIOR_NOTICE} Nominal sizes are a starting
                point; interior dimensions vary between manufacturers.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <NumericField
              label="Flat inside length"
              unit="in"
              value={values.usableInteriorLengthInches}
              min={4}
              max={30}
              step={0.25}
              hint="Editing this confirms your own measurement."
              onChange={(usableInteriorLengthInches) => {
                setValues({ usableInteriorLengthInches });
                setPanInteriorMeasured(true);
              }}
            />
            <NumericField
              label="Flat inside width"
              unit="in"
              value={values.usableInteriorWidthInches}
              min={4}
              max={30}
              step={0.25}
              hint="Editing this confirms your own measurement."
              onChange={(usableInteriorWidthInches) => {
                setValues({ usableInteriorWidthInches });
                setPanInteriorMeasured(true);
              }}
            />
          </div>
        </>
      )}

      {showAdvanced ? (
        <div className="surface-instrument flex flex-col gap-4 p-4">
          <h3 className="text-sm font-medium">Thickness and fit</h3>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="manual-weight-toggle" className="text-sm">
              Set dough weight directly
            </Label>
            <Switch
              id="manual-weight-toggle"
              checked={isManual}
              onCheckedChange={(checked) =>
                setValues({
                  sizingMode: checked ? "manual-dough-weight" : "dough-loading",
                })
              }
            />
          </div>

          {isManual ? (
            <NumericField
              label={isRound ? "Dough per pizza" : "Dough per pan"}
              unit="g"
              value={values.manualDoughWeightGrams}
              min={100}
              max={2000}
              step={5}
              hint="The dough loading below is worked back from this weight."
              onChange={(manualDoughWeightGrams) =>
                setValues({ manualDoughWeightGrams })
              }
            />
          ) : (
            <NumericField
              label="Dough loading"
              unit="g/in²"
              value={values.doughLoadingGramsPerSquareInch}
              min={1}
              max={8}
              step={0.05}
              hint="Grams of dough per square inch of baking surface. Higher means a thicker crust."
              help={{
                term: "Dough loading",
                definition:
                  "How much dough is assigned to each square inch of baking area.",
                effect:
                  "Higher loading makes a thicker pizza and increases total dough.",
                current: `${values.doughLoadingGramsPerSquareInch.toFixed(2)} g per square inch`,
              }}
              onChange={(doughLoadingGramsPerSquareInch) =>
                setValues({ doughLoadingGramsPerSquareInch })
              }
            />
          )}

          {isRound ? (
            <div className="flex flex-col gap-2 border-t-[0.5px] border-graphite pt-4">
              <span className="flex items-center gap-1">
                <Label htmlFor="baking-surface">
                  Optional surface fit check
                </Label>
                <ContextHelp
                  content={{
                    term: "Baking surface fit",
                    definition:
                      "The selected surface is checked against the pizza diameter for physical fit.",
                    effect:
                      "It changes fit guidance only, never the ingredient amounts.",
                    current:
                      STEEL_PROFILES.find((profile) => profile.id === surfaceId)
                        ?.name ?? "Custom surface",
                  }}
                />
              </span>
              <Select
                value={surfaceId}
                onValueChange={(next) => {
                  if (typeof next === "string") setSurfaceId(next);
                }}
                items={Object.fromEntries(
                  STEEL_PROFILES.map((profile) => [profile.id, profile.name])
                )}
              >
                <SelectTrigger id="baking-surface" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEEL_PROFILES.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Useful only for an overhang warning. It does not alter the
                recipe.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
