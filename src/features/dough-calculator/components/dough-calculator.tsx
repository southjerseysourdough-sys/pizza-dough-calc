"use client";

import { CalendarClockIcon, WrenchIcon } from "lucide-react";
import dynamic from "next/dynamic";

import { Switch } from "@/components/ui/switch";
import {
  useCalculatorPersistence,
  useDoughCalculation,
} from "../hooks/use-dough-calculation";
import { PAN_PROFILES, STEEL_PROFILES } from "../presets/equipment";
import { findPreset } from "../presets/formulas";
import { useCalculatorStore } from "../store/calculator-store";
import { formatTotalWeight } from "../utils/format";
import { createRecipeDraftDocument } from "../utils/recipe-draft";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { CustomIngredientEditor } from "./custom-ingredient-editor";
import { DoughStage } from "./dough-stage";
import { FlourBlendEditor } from "./flour-blend-editor";
import { FormatCards } from "./format-cards";
import { FormulaControls } from "./formula-controls";
import { IssueList } from "./issue-list";
import { QuantityStepper } from "./quantity-stepper";
import { RecipeSummary } from "./recipe-summary";
import { RecipeStatus } from "./recipe-status";
import { SizeControls } from "./size-controls";
import { StepSection } from "./step-section";
import { LaunchTools } from "@/features/launch/ui/launch-tools";

const FermentationPlanner = dynamic(() =>
  import("./fermentation-planner").then((module) => module.FermentationPlanner)
);

/** The anchor the stage's "start here" link points at. */
const FIRST_STEP_ID = "step-1";

function DetailBlock({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t-[0.5px] border-graphite pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground">
          {code}
        </span>
      </div>
      {children}
    </section>
  );
}

/**
 * The calculator, as one path from start to finish.
 *
 * Shape, size, batch, dough — four steps in the order a baker actually makes
 * those decisions, each numbered, with the result at the end. The advanced
 * toggle adds precision controls inside the steps that own them rather than
 * opening a separate parallel interface.
 */
export function DoughCalculator() {
  useCalculatorPersistence();

  const presetId = useCalculatorStore((state) => state.presetId);
  const formatMode = useCalculatorStore((state) => state.formatMode);
  const setFormatMode = useCalculatorStore((state) => state.setFormatMode);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);
  const setShowAdvanced = useCalculatorStore((state) => state.setShowAdvanced);
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const surfaceId = useCalculatorStore((state) => state.surfaceId);
  const panProfileId = useCalculatorStore((state) => state.panProfileId);
  const panInteriorMeasured = useCalculatorStore(
    (state) => state.panInteriorMeasured
  );
  const workingName = useRecipeLibraryStore((state) => state.workingName);
  const fermentationPlan = useCalculatorStore(
    (state) => state.fermentationPlan
  );
  const fermentationWorkspaceOpen = useCalculatorStore(
    (state) => state.fermentationWorkspaceOpen
  );
  const setFermentationWorkspaceOpen = useCalculatorStore(
    (state) => state.setFermentationWorkspaceOpen
  );

  const { calculation, fieldErrors, surfaceWarning } = useDoughCalculation();
  const preset = findPreset(presetId);
  const result = calculation.ok ? calculation.result : null;
  const errors = calculation.ok ? [] : calculation.issues;
  const summaryWarnings = surfaceWarning ? [surfaceWarning] : [];
  const isRound = values.shape === "round";
  const unitNoun = isRound ? "pizza" : "pan";
  const equipmentName = isRound
    ? (STEEL_PROFILES.find((surface) => surface.id === surfaceId)?.name ??
      "Custom surface")
    : (PAN_PROFILES.find((pan) => pan.id === panProfileId)?.name ??
      "Custom pan");
  const recipeDocument = createRecipeDraftDocument({
    name: workingName ?? preset?.name ?? "Untitled pizza recipe",
    values,
    context: {
      presetId,
      surfaceId,
      panProfileId,
      panInteriorMeasured,
    },
    fermentationPlan,
  });

  return (
    <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-4 px-4 pb-16 sm:px-6">
      <DoughStage
        values={values}
        result={result}
        startHref={`#${FIRST_STEP_ID}`}
      />

      <RecipeStatus />

      <LaunchTools document={recipeDocument.ok ? recipeDocument.value : null} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7 xl:col-span-8">
          <div className="surface-workbench overflow-hidden">
            <StepSection
              id={FIRST_STEP_ID}
              step={1}
              title="Round pizza or pan pizza?"
              hint="This decides which sizes and dough styles you are offered."
              data-onboarding-target="format"
            >
              <FormatCards value={formatMode} onChange={setFormatMode} />
            </StepSection>

            <StepSection
              step={2}
              title={isRound ? "What size?" : "Which pan?"}
              hint={
                isRound
                  ? "A 16 inch pizza is the standard 480 g dough ball."
                  : "Pick the pan you own, then measure its flat inside surface."
              }
              data-onboarding-target="geometry"
            >
              <SizeControls />
            </StepSection>

            <StepSection
              step={3}
              title={`How many ${unitNoun}s are you making?`}
              hint="Everything below scales to this number."
              data-onboarding-target="quantity"
            >
              <div className="flex flex-col gap-3 sm:max-w-sm">
                <QuantityStepper
                  label={isRound ? "Number of pizzas" : "Number of pans"}
                  value={values.quantity}
                  unitNoun={unitNoun}
                  onChange={(quantity) => setValues({ quantity })}
                />
                {result ? (
                  <p className="tabular text-sm text-secondary-foreground">
                    {formatTotalWeight(result.sizing.doughWeightPerUnitGrams)}{" "}
                    each ·{" "}
                    <span className="font-semibold text-foreground">
                      {formatTotalWeight(result.sizing.totalDoughWeightGrams)}{" "}
                      total
                    </span>
                  </p>
                ) : null}
              </div>
            </StepSection>

            <StepSection
              step={4}
              title="Choose your dough"
              hint="Pick a style, then adjust how wet the dough is."
              data-onboarding-target="formula"
            >
              <FormulaControls />
            </StepSection>
          </div>

          <div className="surface-workbench flex flex-col divide-y-[0.5px] divide-graphite overflow-hidden">
            <button
              type="button"
              aria-label="Open fermentation planner"
              aria-expanded={fermentationWorkspaceOpen}
              onClick={() => setFermentationWorkspaceOpen(true)}
              data-onboarding-target="fermentation"
              className="flex min-h-13 items-center gap-3 px-5 py-3.5 text-left hover:bg-inset focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none sm:px-6"
            >
              <CalendarClockIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-acid-lime"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Plan the fermentation
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Optional — schedule mix and bake times.
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {fermentationPlan?.enabled ? "Planned" : "Set schedule"}
              </span>
            </button>

            <label className="flex min-h-13 cursor-pointer items-center gap-3 px-5 py-3.5 sm:px-6">
              <WrenchIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Advanced options
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Salt, yeast, oil, flour blend, dough thickness.
                </span>
              </span>
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
                aria-label="Advanced options"
              />
            </label>
          </div>

          {fermentationWorkspaceOpen && recipeDocument.ok ? (
            <FermentationPlanner document={recipeDocument.value} />
          ) : null}

          {showAdvanced ? (
            <div className="surface-workbench overflow-hidden motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-top-1">
              <div className="flex items-center justify-between border-b-[0.5px] border-graphite px-5 py-4 sm:px-6">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
                    Precision layer
                  </span>
                  <h2 className="text-base font-medium">
                    Flour blend and extras
                  </h2>
                </div>
                <span className="hidden rounded-sm border-[0.5px] border-graphite px-2 py-1 font-mono text-[9px] text-muted-foreground sm:block">
                  FLOUR · EXTRAS
                </span>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
                <DetailBlock title="Main Dough Flour Blend" code="FLOUR.01">
                  <FlourBlendEditor result={result} />
                </DetailBlock>
                <DetailBlock title="Custom ingredients" code="FORMULA.06">
                  <CustomIngredientEditor result={result} />
                </DetailBlock>
              </div>
            </div>
          ) : null}

          {showAdvanced && preset && preset.assumptions.length > 0 ? (
            <section className="border-l-[0.5px] border-graphite px-4 py-2">
              <h2 className="mb-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                Profile assumptions
              </h2>
              <ul className="grid gap-1 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
                {preset.assumptions.map((assumption) => (
                  <li
                    key={assumption}
                    className="before:mr-2 before:text-smoke before:content-['—']"
                  >
                    {assumption}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/*
          A grid item defaults to min-width:auto, so without min-w-0 the widest
          unbreakable content in the recipe panel sets the column width and
          pushes the whole page into horizontal scroll on a phone.
        */}
        <aside className="min-w-0 lg:col-span-5 xl:col-span-4">
          <div className="flex flex-col gap-3 lg:sticky lg:top-[4.25rem]">
            {errors.length > 0 || fieldErrors.length > 0 ? (
              <section className="surface-workbench p-5">
                <h2 className="mb-3 text-base font-medium">
                  Check these values
                </h2>
                <IssueList issues={errors.length > 0 ? errors : fieldErrors} />
              </section>
            ) : result ? (
              <>
                <RecipeSummary
                  result={result}
                  shape={values.shape}
                  styleLabel={preset?.name ?? ""}
                  surfaceLabel={equipmentName}
                  document={recipeDocument.ok ? recipeDocument.value : null}
                />
                {summaryWarnings.length > 0 ? (
                  <IssueList issues={summaryWarnings} />
                ) : null}
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
