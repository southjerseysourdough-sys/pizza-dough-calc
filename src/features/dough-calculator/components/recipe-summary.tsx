"use client";

import { ChevronDownIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

import BorderGlow from "@/components/effects/BorderGlow";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { DoughFormulaResult } from "../types/dough";
import {
  formatArea,
  formatIngredientGrams,
  formatPercentage,
  formatTotalWeight,
} from "../utils/format";
import { AnimatedNumber } from "./animated-number";
import { CompositionBar } from "./composition-bar";
import { IssueList } from "./issue-list";

/**
 * The signature result.
 *
 * Three layers, deliberately unequal:
 *  1. the headline — what the baker came for, at instrument scale
 *  2. the composition — the shape of the formula at a glance
 *  3. the full ledger — every exact value, one disclosure away
 *
 * Nothing is removed by the layering: the ledger holds the same figures it
 * always did, it simply stops competing with the headline.
 */

function LedgerRow({
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
    <div className="flex items-baseline justify-between gap-4 py-1.5">
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
          <span className="text-xs text-muted-foreground/80">{detail}</span>
        ) : null}
      </div>
      <span
        className={cn(
          "tabular shrink-0",
          emphasis
            ? "text-sm font-semibold text-foreground"
            : "text-sm text-foreground/90"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function LedgerSection({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-4 mb-1 text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
      {children}
    </h4>
  );
}

export function RecipeSummary({
  result,
  shape,
  styleLabel,
  surfaceLabel,
  className,
}: {
  result: DoughFormulaResult;
  shape: "round" | "rectangular";
  /** The preset name, e.g. "New York on Baking Steel Plus". */
  styleLabel: string;
  surfaceLabel: string;
  className?: string;
}) {
  const [showLedger, setShowLedger] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  // Pointer-driven edge light is pointless on touch, where nothing hovers.
  const hasFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)");

  const { sizing, starter } = result;
  const unitNoun = shape === "round" ? "pizza" : "pan";
  const unitLabel = `${sizing.quantity} ${unitNoun}${sizing.quantity === 1 ? "" : "s"}`;

  // The starter is pulled out of the main list so it can be shown once, in
  // its own section, without being counted twice.
  const mainDoughIngredients = result.ingredients.filter(
    (ingredient) => ingredient.kind !== "starter"
  );

  const sizeLabel =
    shape === "round"
      ? `${formatArea(sizing.areaPerUnitSquareInches)} each`
      : `${formatArea(sizing.areaPerUnitSquareInches)} pan`;

  return (
    <BorderGlow
      className={cn("w-full", className)}
      borderRadius={12}
      glowRadius={14}
      glowIntensity={0.28}
      coneSpread={18}
      fillOpacity={0.2}
      // Pointer-only: never animates on its own, and switched off entirely
      // under reduced motion or on touch.
      animated={false}
      disabled={Boolean(prefersReducedMotion) || !hasFinePointer}
    >
      <section
        role="region"
        aria-labelledby="recipe-summary-heading"
        aria-live="polite"
        aria-atomic="false"
        className="flex flex-col p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="recipe-summary-heading"
            className="font-mono text-[10px] font-normal tracking-[0.12em] text-muted-foreground uppercase"
          >
            Your recipe
          </h2>
          <span className="tabular text-xs text-muted-foreground">
            {unitLabel}
          </span>
        </div>

        {/* LAYER ONE — the headline. */}
        <div className="sr-only lg:not-sr-only lg:mt-4 lg:flex lg:flex-col lg:gap-1">
          <AnimatedNumber
            value={result.totalDoughWeightGrams}
            format={formatTotalWeight}
            className="text-[2.85rem] leading-none font-normal tracking-[-0.022em] text-foreground sm:text-[3.35rem]"
          />
          <p className="text-sm font-medium text-secondary-foreground">
            {unitLabel} · {formatTotalWeight(sizing.doughWeightPerUnitGrams)}{" "}
            each
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {formatPercentage(result.trueFinalHydration)} hydration ·{" "}
            {sizeLabel}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border-[0.5px] border-graphite bg-graphite">
            <ResultMeta
              label="Hydration"
              value={formatPercentage(result.trueFinalHydration)}
            />
            <ResultMeta label="Geometry" value={sizeLabel} />
            <ResultMeta label="Style" value={styleLabel} />
            <ResultMeta label="Surface" value={surfaceLabel} />
          </div>
        </div>

        {/* LAYER TWO — the shape of the formula. */}
        <div className="mt-5">
          <h3 className="mb-2.5 font-mono text-[10px] font-normal tracking-[0.1em] text-muted-foreground uppercase">
            Composition
          </h3>
          <CompositionBar result={result} />
        </div>

        {result.warnings.length > 0 ? (
          <IssueList issues={result.warnings} className="mt-4" />
        ) : null}

        {/* LAYER THREE — every exact value, one click away. */}
        <div className="mt-4 border-t-[0.5px] border-graphite pt-3">
          <button
            type="button"
            onClick={() => setShowLedger((open) => !open)}
            aria-expanded={showLedger}
            aria-controls="recipe-ledger"
            className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <span>Full ingredient ledger</span>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                showLedger && "rotate-180"
              )}
            />
          </button>

          {showLedger ? (
            <div id="recipe-ledger" className="pb-1">
              <LedgerSection>Main dough</LedgerSection>
              <div className="divide-y divide-hairline/30">
                {mainDoughIngredients.map((ingredient) => (
                  <LedgerRow
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
                  <LedgerSection>Main dough flour blend</LedgerSection>
                  <div className="divide-y divide-hairline/30">
                    {result.flourBlend.map((flour) => (
                      <LedgerRow
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
                  <LedgerSection>Starter</LedgerSection>
                  <div className="divide-y divide-hairline/30">
                    <LedgerRow
                      label="Total starter"
                      value={`${formatIngredientGrams(starter.weightGrams, "starter")} g`}
                      detail="Weigh this out as one piece"
                      emphasis
                    />
                    <LedgerRow
                      label="Starter flour"
                      value={`${formatIngredientGrams(starter.flourGrams, "flour")} g`}
                      detail="Already counted in total flour"
                    />
                    <LedgerRow
                      label="Starter water"
                      value={`${formatIngredientGrams(starter.waterGrams, "water")} g`}
                      detail="Already counted in total water"
                    />
                    <LedgerRow
                      label="Prefermented flour"
                      value={formatPercentage(
                        starter.prefermentedFlourPercentage
                      )}
                    />
                  </div>
                </>
              ) : null}

              <LedgerSection>Totals</LedgerSection>
              <div className="divide-y divide-hairline/30">
                <LedgerRow
                  label="Total formula flour"
                  value={`${formatIngredientGrams(result.totalFlourGrams, "flour")} g`}
                  detail="Including any flour inside the starter"
                />
                <LedgerRow
                  label="Total formula water"
                  value={`${formatIngredientGrams(result.totalWaterGrams, "water")} g`}
                  detail="Including any water inside the starter"
                />
                <LedgerRow
                  label="True hydration"
                  value={formatPercentage(result.trueFinalHydration)}
                />
                <LedgerRow
                  label={`Dough per ${unitNoun}`}
                  value={formatTotalWeight(sizing.doughWeightPerUnitGrams)}
                />
                <LedgerRow
                  label="Total dough weight"
                  value={formatTotalWeight(result.totalDoughWeightGrams)}
                  emphasis
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </BorderGlow>
  );
}

function ResultMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5 bg-inset px-2.5 py-2">
      <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="tabular truncate text-[11px] text-secondary-foreground">
        {value}
      </span>
    </span>
  );
}
