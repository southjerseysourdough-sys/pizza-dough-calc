"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CALCULATOR_PRESETS } from "../presets/formulas";
import type { CalculatorFormValues } from "../schemas/calculator-schema";
import type { CalculatorFormatMode } from "../store/calculator-store";
import { useCalculatorStore } from "../store/calculator-store";
import type { DoughFormulaResult } from "../types/dough";
import {
  formatArea,
  formatDoughLoading,
  formatPercentage,
  formatTotalWeight,
} from "../utils/format";
import { AnimatedNumber } from "./animated-number";
import { DoughField, type DoughFieldState } from "./dough-field";
import { FormatCards } from "./format-cards";

/** Maps calculator source values onto the illustrative Dough Field. */
export function toVisualState(
  values: CalculatorFormValues,
  result: DoughFormulaResult | null
): DoughFieldState {
  return {
    shape: values.shape,
    diameterInches: values.diameterInches,
    interiorLengthInches: values.usableInteriorLengthInches,
    interiorWidthInches: values.usableInteriorWidthInches,
    hydrationPercent: values.hydrationPercent,
    doughLoadingGramsPerSquareInch:
      result?.sizing.effectiveDoughLoadingGramsPerSquareInch ??
      values.doughLoadingGramsPerSquareInch,
    totalDoughWeightGrams: result?.totalDoughWeightGrams ?? 0,
    quantity: values.quantity,
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t-[0.5px] border-graphite pt-3">
      <span className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="tabular text-sm text-secondary-foreground">{value}</span>
    </div>
  );
}

export function DoughStage({
  values,
  formatMode,
  onFormatChange,
  result,
  presetName,
  className,
}: {
  values: CalculatorFormValues;
  formatMode: CalculatorFormatMode;
  onFormatChange: (mode: CalculatorFormatMode) => void;
  result: DoughFormulaResult | null;
  presetName: string;
  className?: string;
}) {
  const presetId = useCalculatorStore((state) => state.presetId);
  const applyPreset = useCalculatorStore((state) => state.applyPreset);
  const fieldState = toVisualState(values, result);
  const isRound = values.shape === "round";

  const sizeValue = isRound
    ? `${values.diameterInches}″ diameter`
    : `${values.usableInteriorLengthInches}″ × ${values.usableInteriorWidthInches}″`;

  return (
    <section
      aria-label="Dough Lab"
      className={cn("surface-stage overflow-hidden", className)}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(14rem,0.8fr)_minmax(22rem,1.25fr)_minmax(12rem,0.7fr)]">
        <div className="flex flex-col gap-5 border-b-[0.5px] border-graphite p-5 lg:border-r-[0.5px] lg:border-b-0 xl:p-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.14em] text-acid-lime uppercase">
              Dough Lab / Online
            </span>
            <h1 className="text-[1.75rem] leading-[1.08] font-normal tracking-[-0.022em] text-foreground sm:text-[2rem]">
              Precision dough, measured by area.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Choose the geometry. The formula resolves live in baker&rsquo;s
              percentages.
            </p>
          </div>

          <FormatCards value={formatMode} onChange={onFormatChange} />

          <div className="mt-auto flex flex-col gap-2">
            <Label
              htmlFor="stage-preset"
              className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase"
            >
              Recipe profile
            </Label>
            <Select
              value={presetId}
              onValueChange={(next) => {
                if (typeof next === "string") applyPreset(next);
              }}
              items={Object.fromEntries(
                CALCULATOR_PRESETS.map((preset) => [preset.id, preset.name])
              )}
            >
              <SelectTrigger id="stage-preset" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALCULATOR_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-b-[0.5px] border-graphite p-3 sm:p-4 lg:border-r-[0.5px] lg:border-b-0">
          <DoughField state={fieldState} className="lg:h-full" />
          <div className="mt-3 flex items-end justify-between border-t-[0.5px] border-graphite pt-3 lg:hidden">
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                Total dough
              </span>
              {result ? (
                <AnimatedNumber
                  value={result.totalDoughWeightGrams}
                  format={formatTotalWeight}
                  className="text-[2rem] leading-none font-normal tracking-[-0.022em] text-foreground"
                />
              ) : (
                <span className="text-2xl text-muted-foreground">—</span>
              )}
            </span>
            <span className="tabular text-right text-xs text-muted-foreground">
              {values.quantity} {isRound ? "pizza" : "pan"}
              {values.quantity === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="hidden flex-col justify-between gap-6 p-5 lg:flex xl:p-6">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
              Total dough
            </span>
            {result ? (
              <AnimatedNumber
                value={result.totalDoughWeightGrams}
                format={formatTotalWeight}
                className="text-[2.5rem] leading-none font-normal tracking-[-0.022em] text-foreground xl:text-[3rem]"
              />
            ) : (
              <span className="text-[2.5rem] text-muted-foreground">—</span>
            )}
            <span className="mt-1 text-xs text-muted-foreground">
              {presetName}
            </span>
          </div>

          <div className="grid gap-3">
            <Stat label="Geometry" value={sizeValue} />
            <Stat
              label={isRound ? "Area / pizza" : "Area / pan"}
              value={
                result ? formatArea(result.sizing.areaPerUnitSquareInches) : "—"
              }
            />
            <Stat
              label="Hydration"
              value={formatPercentage(values.hydrationPercent / 100)}
            />
            <Stat
              label="Dough loading"
              value={formatDoughLoading(
                result?.sizing.effectiveDoughLoadingGramsPerSquareInch ??
                  values.doughLoadingGramsPerSquareInch
              )}
            />
            <Stat
              label={isRound ? "Quantity / pizzas" : "Quantity / pans"}
              value={String(values.quantity)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
