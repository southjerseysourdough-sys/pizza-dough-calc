"use client";

import { cn } from "@/lib/utils";
import type { DoughFormulaResult, IngredientKind } from "../types/dough";
import { formatIngredientGrams, formatPercentage } from "../utils/format";

/**
 * A visual guide to the formula's structure.
 *
 * Not a chart and not a scientific instrument — it shows at a glance how much
 * of the dough is flour, how much is water and how small everything else is.
 * Built from plain HTML and CSS with no charting library: it is a labelled
 * list that happens to be drawn as a bar, so every segment carries its exact
 * gram weight and percentage in text.
 */

/** Each ingredient gets a fixed tone so the bar reads consistently. */
const KIND_TONE: Record<IngredientKind, string> = {
  flour: "bg-acid-lime",
  water: "bg-mist/80",
  starter: "bg-fog",
  salt: "bg-ash",
  fat: "bg-smoke",
  sugar: "bg-fog/75",
  malt: "bg-smoke/80",
  yeast: "bg-ash/75",
  custom: "bg-fog/60",
};

/** Segments thinner than this are invisible, so they are floored to it. */
const MIN_SEGMENT_PERCENT = 0.8;

export function CompositionBar({ result }: { result: DoughFormulaResult }) {
  const total = result.totalDoughWeightGrams;

  // The engine's ingredient list already counts the starter exactly once, so
  // reusing it here cannot double count starter flour or water.
  const segments = result.ingredients
    .filter((ingredient) => ingredient.grams > 0)
    .map((ingredient) => ({
      ...ingredient,
      share: total > 0 ? ingredient.grams / total : 0,
    }));

  const widths = segments.map((segment) =>
    Math.max(segment.share * 100, MIN_SEGMENT_PERCENT)
  );
  const widthTotal = widths.reduce((sum, width) => sum + width, 0);

  return (
    <div className="flex flex-col gap-3">
      {/*
       * The bar is decorative: every value it encodes is written out in the
       * list below, which is what assistive technology reads.
       */}
      <div
        aria-hidden="true"
        className="surface-inset flex h-2 w-full gap-px overflow-hidden p-0"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className={cn(
              "h-full transition-[width] duration-300 ease-out first:rounded-l-sm last:rounded-r-sm motion-reduce:transition-none",
              KIND_TONE[segment.kind]
            )}
            style={{ width: `${(widths[index] / widthTotal) * 100}%` }}
          />
        ))}
      </div>

      <ul
        aria-label="Ingredient composition"
        className="grid grid-cols-2 gap-x-4 gap-y-1.5"
      >
        {segments.map((segment) => (
          <li
            key={segment.id}
            className="flex items-center gap-2 text-xs leading-tight"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-[2px]",
                KIND_TONE[segment.kind]
              )}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {segment.label}
            </span>
            <span className="tabular shrink-0 font-medium text-foreground">
              {formatIngredientGrams(segment.grams, segment.kind)} g
            </span>
            <span className="tabular w-10 shrink-0 text-right text-muted-foreground/80">
              {formatPercentage(segment.share, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
