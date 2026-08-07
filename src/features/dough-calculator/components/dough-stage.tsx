"use client";

import { ArrowDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalculatorFormValues } from "../schemas/calculator-schema";
import type { DoughFormulaResult } from "../types/dough";
import { formatTotalWeight } from "../utils/format";
import { AnimatedNumber } from "./animated-number";
import { DoughField, type DoughFieldState } from "./dough-field";

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

/**
 * The stage above the steps.
 *
 * It does two jobs and no more: show the running total so the effect of every
 * step is visible without scrolling, and point unambiguously at where to
 * begin. Every control that used to live here now sits inside the step it
 * belongs to.
 */
export function DoughStage({
  values,
  result,
  startHref,
  className,
}: {
  values: CalculatorFormValues;
  result: DoughFormulaResult | null;
  /** Anchor for the "start here" link, pointing at the first step. */
  startHref: string;
  className?: string;
}) {
  const fieldState = toVisualState(values, result);
  const isRound = values.shape === "round";
  const unitNoun = isRound ? "pizza" : "pan";
  const quantity = Number.isFinite(values.quantity) ? values.quantity : 0;

  return (
    <section
      aria-label="Dough Lab"
      className={cn("surface-stage overflow-hidden", className)}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(20rem,1fr)_minmax(18rem,1fr)]">
        <div className="flex flex-col gap-5 border-b-[0.5px] border-graphite p-5 lg:border-r-[0.5px] lg:border-b-0 xl:p-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.14em] text-acid-lime uppercase">
              Dough Lab / Online
            </span>
            <h1 className="text-[1.75rem] leading-[1.08] font-normal tracking-[-0.022em] text-foreground sm:text-[2rem]">
              Pizza dough without the guesswork.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Four short steps. Your ingredient weights update as you go, and
              the finished recipe waits at the bottom.
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-1">
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
              <span className="text-[2.5rem] leading-none text-muted-foreground">
                —
              </span>
            )}
            <p className="tabular mt-1 text-sm text-secondary-foreground">
              {quantity} {unitNoun}
              {quantity === 1 ? "" : "s"}
              {result
                ? ` · ${formatTotalWeight(result.sizing.doughWeightPerUnitGrams)} each`
                : ""}
            </p>
          </div>

          <a
            href={startHref}
            className="group inline-flex w-fit items-center gap-2 rounded-md border-[0.5px] border-acid-lime/60 bg-acid-lime/10 px-3.5 py-2 text-sm font-medium text-acid-lime transition-colors hover:bg-acid-lime/20 focus-visible:ring-2 focus-visible:ring-acid-lime focus-visible:outline-none"
          >
            Start with step 1
            <ArrowDownIcon
              aria-hidden="true"
              className="size-4 transition-transform motion-safe:group-hover:translate-y-0.5"
            />
          </a>
        </div>

        {/*
         * Centred rather than stretched: the preview holds the sprite's own
         * 16:9 ratio, so forcing it to the column height would only crop it.
         */}
        <div className="flex items-center p-3 sm:p-4">
          <DoughField state={fieldState} />
        </div>
      </div>
    </section>
  );
}
