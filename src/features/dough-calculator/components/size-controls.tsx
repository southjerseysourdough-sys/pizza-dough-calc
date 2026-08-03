"use client";

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
import { useCalculatorStore } from "../store/calculator-store";
import {
  formatArea,
  formatDoughLoading,
  formatTotalWeight,
} from "../utils/format";
import type { SizingResult } from "../types/dough";
import { NumericField } from "./numeric-field";

/**
 * Size and equipment controls for both formats.
 *
 * Equipment selection only drives fit guidance — changing a surface or pan
 * never rewrites a formula value.
 */

function DerivedRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          emphasis
            ? "tabular text-sm font-semibold text-foreground"
            : "tabular text-sm text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function SizeControls({ sizing }: { sizing: SizingResult | null }) {
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

  return (
    <div className="flex flex-col gap-6">
      {isRound ? (
        <>
          <NumericField
            label="Pizza diameter"
            unit="in"
            value={values.diameterInches}
            min={6}
            max={20}
            step={0.5}
            onChange={(diameterInches) => setValues({ diameterInches })}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="baking-surface">Baking surface</Label>
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
            <p className="text-xs text-muted-foreground">
              Used for fit guidance only. It never changes your formula.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pan-profile">Pan</Label>
            <Select
              value={panProfileId}
              onValueChange={(next) => {
                if (typeof next === "string") setPanProfile(next);
              }}
              items={Object.fromEntries(
                PAN_PROFILES.map((profile) => [profile.id, profile.name])
              )}
            >
              <SelectTrigger id="pan-profile" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAN_PROFILES.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="surface-instrument flex items-start justify-between gap-3 px-3 py-2.5">
            <Label
              htmlFor="pan-measured"
              className="text-sm leading-snug font-normal"
            >
              I measured the flat inside baking surface of this pan
            </Label>
            <Switch
              id="pan-measured"
              checked={panInteriorMeasured}
              onCheckedChange={setPanInteriorMeasured}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumericField
              label={
                panInteriorMeasured
                  ? "Measured interior length"
                  : "Interior length (nominal)"
              }
              unit="in"
              value={values.usableInteriorLengthInches}
              min={4}
              max={30}
              step={0.25}
              onChange={(usableInteriorLengthInches) =>
                setValues({ usableInteriorLengthInches })
              }
            />
            <NumericField
              label={
                panInteriorMeasured
                  ? "Measured interior width"
                  : "Interior width (nominal)"
              }
              unit="in"
              value={values.usableInteriorWidthInches}
              min={4}
              max={30}
              step={0.25}
              onChange={(usableInteriorWidthInches) =>
                setValues({ usableInteriorWidthInches })
              }
            />
          </div>
        </>
      )}

      <NumericField
        label={isRound ? "Number of pizzas" : "Number of pans"}
        value={values.quantity}
        min={1}
        max={12}
        step={1}
        onChange={(quantity) => setValues({ quantity })}
      />

      {showAdvanced ? (
        <div className="surface-instrument flex flex-col gap-4 p-4">
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
              onChange={(doughLoadingGramsPerSquareInch) =>
                setValues({ doughLoadingGramsPerSquareInch })
              }
            />
          )}
        </div>
      ) : null}

      {sizing ? (
        <div className="surface-inset divide-y divide-hairline/30 px-4 py-2">
          <DerivedRow
            label={isRound ? "Area per pizza" : "Usable pan area"}
            value={formatArea(sizing.areaPerUnitSquareInches)}
          />
          <DerivedRow
            label={isRound ? "Dough per pizza" : "Dough per pan"}
            value={`${formatTotalWeight(sizing.doughWeightPerUnitGrams)}`}
          />
          <DerivedRow
            label="Total dough"
            value={formatTotalWeight(sizing.totalDoughWeightGrams)}
            emphasis
          />
          <DerivedRow
            label={
              sizing.isLoadingDerived
                ? "Dough loading (derived)"
                : "Dough loading"
            }
            value={formatDoughLoading(
              sizing.effectiveDoughLoadingGramsPerSquareInch
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
