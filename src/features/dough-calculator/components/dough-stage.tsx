"use client";

import { DoughVisualizer } from "@/components/three/dough-visualizer";
import type { DoughVisualState } from "@/components/three/dough-visualizer";
import { cn } from "@/lib/utils";
import type { CalculatorFormValues } from "../schemas/calculator-schema";
import type { CalculatorFormatMode } from "../store/calculator-store";
import type { DoughFormulaResult } from "../types/dough";
import { formatTotalWeight } from "../utils/format";
import { AnimatedNumber } from "./animated-number";
import { FormatCards } from "./format-cards";

/**
 * Level one: the live dough stage.
 *
 * The strongest area of the page. It answers "what am I making, and how much
 * dough is that" before any control is touched, and pairs the live form with
 * the headline weight so the visualization and the number read as one object
 * rather than two unrelated panels.
 */

/** Maps calculator source inputs onto the visualizer's form. */
export function toVisualState(
  values: CalculatorFormValues,
  result: DoughFormulaResult | null
): DoughVisualState {
  const length = values.usableInteriorLengthInches;
  const width = values.usableInteriorWidthInches;
  const ratio = width > 0 && length > 0 ? length / width : 1.4;

  return {
    shape: values.shape,
    doughWeightPerUnitGrams: result?.sizing.doughWeightPerUnitGrams ?? 560,
    hydration: values.hydrationPercent / 100,
    diameterInches: values.diameterInches,
    panAspectRatio: ratio,
    quantity: values.quantity,
  };
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.65rem] font-medium tracking-[0.1em] text-muted-foreground/80 uppercase">
        {label}
      </span>
      <span className="tabular text-sm font-semibold text-foreground">
        {value}
      </span>
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
  const visualState = toVisualState(values, result);
  const isRound = values.shape === "round";

  const sizeValue = isRound
    ? `${values.diameterInches}″`
    : `${values.usableInteriorLengthInches}″ × ${values.usableInteriorWidthInches}″`;

  return (
    <section
      aria-label="Dough Lab"
      className={cn(
        "surface-stage edge-highlight relative overflow-hidden",
        className
      )}
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
        {/* Left: what you are making. */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-semibold tracking-[0.16em] text-ember uppercase">
              Dough Lab
            </span>
            <h1 className="text-2xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-3xl">
              Pizza dough, sized by area
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Set the pan or the pie and the formula follows, in baker&rsquo;s
              percentages.
            </p>
          </div>

          <FormatCards value={formatMode} onChange={onFormatChange} />
        </div>

        {/* Right: the live form and its headline weight. */}
        <div className="flex flex-col gap-4">
          <DoughVisualizer
            state={visualState}
            className="h-44 w-full sm:h-52 lg:h-56"
          />

          <div className="flex items-end justify-between gap-4 border-t border-hairline/40 pt-4">
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-medium tracking-[0.1em] text-muted-foreground/80 uppercase">
                Total dough
              </span>
              {result ? (
                <AnimatedNumber
                  value={result.totalDoughWeightGrams}
                  format={formatTotalWeight}
                  className="text-3xl leading-none font-semibold tracking-tight sm:text-4xl"
                />
              ) : (
                <span className="text-3xl leading-none font-semibold tracking-tight text-muted-foreground">
                  —
                </span>
              )}
            </div>

            <div className="flex gap-5">
              <StatChip
                label={isRound ? "Size" : "Interior"}
                value={sizeValue}
              />
              <StatChip
                label={isRound ? "Pizzas" : "Pans"}
                value={String(values.quantity)}
              />
            </div>
          </div>

          <p className="truncate text-xs text-muted-foreground">{presetName}</p>
        </div>
      </div>
    </section>
  );
}
