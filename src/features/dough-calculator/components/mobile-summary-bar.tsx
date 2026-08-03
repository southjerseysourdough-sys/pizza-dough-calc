"use client";

import type { DoughFormulaResult } from "../types/dough";
import { formatIngredientGrams, formatTotalWeight } from "../utils/format";

/**
 * Compact recipe bar pinned to the bottom on narrow screens.
 *
 * The full summary sits below the controls on mobile, which is a long scroll
 * away, so the headline numbers stay on screen the whole time. Hidden from
 * large screens, where the sticky summary card does this job instead.
 */
export function MobileSummaryBar({
  result,
  shape,
}: {
  result: DoughFormulaResult;
  shape: "round" | "rectangular";
}) {
  const unitNoun = shape === "round" ? "pizza" : "pan";
  const { sizing } = result;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div
        aria-live="polite"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5"
      >
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Total dough
          </span>
          <span className="tabular text-base font-semibold">
            {formatTotalWeight(result.totalDoughWeightGrams)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">
              Per {unitNoun}
            </span>
            <span className="tabular text-sm font-medium">
              {formatTotalWeight(sizing.doughWeightPerUnitGrams)}
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">Flour</span>
            <span className="tabular text-sm font-medium">
              {formatIngredientGrams(result.totalFlourGrams, "flour")} g
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">Water</span>
            <span className="tabular text-sm font-medium">
              {formatIngredientGrams(result.totalWaterGrams, "water")} g
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
