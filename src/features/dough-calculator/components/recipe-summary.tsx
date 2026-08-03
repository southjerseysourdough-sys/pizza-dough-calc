"use client";

import SpotlightCard from "@/components/effects/SpotlightCard";
import { cn } from "@/lib/utils";
import type { DoughFormulaResult } from "../types/dough";
import {
  formatArea,
  formatIngredientGrams,
  formatPercentage,
  formatTotalWeight,
} from "../utils/format";
import { IssueList } from "./issue-list";

/**
 * The live recipe.
 *
 * Recalculates on every keystroke, which is why there is no Calculate button.
 * Values are rendered with tabular figures so digits do not jitter as they
 * update.
 */

function SummaryRow({
  label,
  value,
  detail,
  emphasis,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-sm",
            emphasis ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {detail ? (
          <span className="text-xs text-muted-foreground">{detail}</span>
        ) : null}
      </div>
      <span
        className={cn(
          "tabular shrink-0",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-sm text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export function RecipeSummary({
  result,
  shape,
  className,
}: {
  result: DoughFormulaResult;
  shape: "round" | "rectangular";
  className?: string;
}) {
  const { sizing, starter } = result;
  const unitNoun = shape === "round" ? "pizza" : "pan";

  // The engine returns the starter alongside the other ingredients; it is
  // pulled out here so it can be shown once, in its own section.
  const mainDoughIngredients = result.ingredients.filter(
    (ingredient) => ingredient.kind !== "starter"
  );

  return (
    <SpotlightCard className={cn("p-5", className)}>
      {/* aria-live keeps screen reader users informed as values change, but
          "polite" so it never interrupts mid-edit. */}
      {/* A named landmark, so the recipe can be jumped to directly rather
          than waded through from the top of the controls. */}
      <section
        role="region"
        aria-labelledby="recipe-summary-heading"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="recipe-summary-heading"
            className="font-heading text-base font-semibold"
          >
            Your recipe
          </h2>
          <span className="text-xs text-muted-foreground">
            {sizing.quantity} {unitNoun}
            {sizing.quantity === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
          <SummaryRow
            label="Total dough"
            value={formatTotalWeight(result.totalDoughWeightGrams)}
            detail={`${formatTotalWeight(sizing.doughWeightPerUnitGrams)} per ${unitNoun} · ${formatArea(sizing.areaPerUnitSquareInches)}`}
            emphasis
          />
        </div>

        {/*
         * Main dough excludes the starter row: the starter gets its own
         * section below. Listing it in both places would read as though the
         * baker has to weigh it twice.
         */}
        <SectionHeading>Main dough</SectionHeading>
        <div className="divide-y divide-border">
          {mainDoughIngredients.map((ingredient) => (
            <SummaryRow
              key={ingredient.id}
              label={ingredient.label}
              value={`${formatIngredientGrams(ingredient.grams, ingredient.kind)} g`}
              detail={
                ingredient.kind === "flour"
                  ? "Added flour, excluding any in the starter"
                  : formatPercentage(ingredient.bakersPercentage)
              }
            />
          ))}
        </div>

        {result.flourBlend.length > 1 ? (
          <>
            <SectionHeading>Main dough flour blend</SectionHeading>
            <div className="divide-y divide-border">
              {result.flourBlend.map((flour) => (
                <SummaryRow
                  key={flour.id}
                  label={flour.name || "Unnamed flour"}
                  value={`${formatIngredientGrams(flour.grams, "flour")} g`}
                  detail={formatPercentage(flour.percentage)}
                />
              ))}
            </div>
          </>
        ) : null}

        {starter ? (
          <>
            <SectionHeading>Starter</SectionHeading>
            <div className="divide-y divide-border">
              <SummaryRow
                label="Total starter"
                value={`${formatIngredientGrams(starter.weightGrams, "starter")} g`}
                detail="Weigh this out as one piece"
                emphasis
              />
              <SummaryRow
                label="Starter flour"
                value={`${formatIngredientGrams(starter.flourGrams, "flour")} g`}
                detail="Already counted in total flour"
              />
              <SummaryRow
                label="Starter water"
                value={`${formatIngredientGrams(starter.waterGrams, "water")} g`}
                detail="Already counted in total water"
              />
              <SummaryRow
                label="Prefermented flour"
                value={formatPercentage(starter.prefermentedFlourPercentage)}
              />
            </div>
          </>
        ) : null}

        <SectionHeading>Totals</SectionHeading>
        <div className="divide-y divide-border">
          <SummaryRow
            label="Total formula flour"
            value={`${formatIngredientGrams(result.totalFlourGrams, "flour")} g`}
            detail="Including any flour inside the starter"
          />
          <SummaryRow
            label="Total formula water"
            value={`${formatIngredientGrams(result.totalWaterGrams, "water")} g`}
            detail="Including any water inside the starter"
          />
          <SummaryRow
            label="True hydration"
            value={formatPercentage(result.trueFinalHydration)}
          />
          <SummaryRow
            label={`Dough per ${unitNoun}`}
            value={formatTotalWeight(sizing.doughWeightPerUnitGrams)}
          />
          <SummaryRow
            label="Total dough weight"
            value={formatTotalWeight(result.totalDoughWeightGrams)}
            emphasis
          />
        </div>

        {result.warnings.length > 0 ? (
          <IssueList issues={result.warnings} className="mt-4" />
        ) : null}
      </section>
    </SpotlightCard>
  );
}
