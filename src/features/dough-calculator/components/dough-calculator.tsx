"use client";

import { CalendarClockIcon, WrenchIcon } from "lucide-react";
import dynamic from "next/dynamic";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useCalculatorPersistence,
  useDoughCalculation,
} from "../hooks/use-dough-calculation";
import { PAN_PROFILES, STEEL_PROFILES } from "../presets/equipment";
import { findPreset } from "../presets/formulas";
import { useCalculatorStore } from "../store/calculator-store";
import { formatPercentage, formatTotalWeight } from "../utils/format";
import { createRecipeDraftDocument } from "../utils/recipe-draft";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { CustomIngredientEditor } from "./custom-ingredient-editor";
import { DoughStage } from "./dough-stage";
import { FlourBlendEditor } from "./flour-blend-editor";
import { FormulaControls } from "./formula-controls";
import { IssueList } from "./issue-list";
import { RecipeSummary } from "./recipe-summary";
import { RecipeStatus } from "./recipe-status";
import { SizeControls } from "./size-controls";
import { LaunchTools } from "@/features/launch/ui/launch-tools";

const FermentationPlanner = dynamic(() =>
  import("./fermentation-planner").then((module) => module.FermentationPlanner)
);

function Bench({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-b-[0.5px] border-graphite p-5 last:border-b-0 sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h2 className="text-base font-medium text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

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

function CommandValue({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-center gap-0.5 border-l-[0.5px] border-graphite px-3 py-2.5 first:border-l-0",
        className
      )}
    >
      <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="tabular truncate text-xs text-secondary-foreground">
        {value}
      </span>
    </div>
  );
}

export function DoughCalculator() {
  useCalculatorPersistence();

  const presetId = useCalculatorStore((state) => state.presetId);
  const formatMode = useCalculatorStore((state) => state.formatMode);
  const setFormatMode = useCalculatorStore((state) => state.setFormatMode);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);
  const setShowAdvanced = useCalculatorStore((state) => state.setShowAdvanced);
  const values = useCalculatorStore((state) => state.values);
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
        formatMode={formatMode}
        onFormatChange={setFormatMode}
        result={result}
        presetName={preset?.name ?? ""}
      />

      <RecipeStatus />

      <LaunchTools document={recipeDocument.ok ? recipeDocument.value : null} />

      <section
        aria-label="Current recipe command strip"
        className="surface-workbench grid grid-cols-2 overflow-hidden sm:grid-cols-4 lg:grid-cols-8"
      >
        <CommandValue
          label="Profile"
          value={preset?.name ?? "Custom"}
          className="col-span-2 border-l-0"
        />
        <CommandValue label="Shape" value={isRound ? "Round" : "Sheet pan"} />
        <CommandValue
          label="Dough each"
          value={
            result
              ? formatTotalWeight(result.sizing.doughWeightPerUnitGrams)
              : "—"
          }
        />
        <CommandValue
          label="Hydration"
          value={formatPercentage(values.hydrationPercent / 100)}
        />
        <CommandValue label="Quantity" value={`× ${values.quantity}`} />
        <button
          type="button"
          aria-label="Open fermentation planner"
          className="flex min-h-13 min-w-0 items-center gap-2 border-l-[0.5px] border-graphite px-3 py-2.5 text-left hover:bg-inset focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          aria-expanded={fermentationWorkspaceOpen}
          onClick={() => setFermentationWorkspaceOpen(true)}
        >
          <CalendarClockIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-acid-lime"
          />
          <span className="min-w-0">
            <span className="block font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
              Fermentation
            </span>
            <span className="block truncate text-xs text-secondary-foreground">
              {fermentationPlan?.enabled ? "Planned" : "Set schedule"}
            </span>
          </span>
        </button>
        <label className="flex min-w-0 cursor-pointer items-center justify-between gap-2 border-l-[0.5px] border-graphite px-3 py-2.5">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
              More controls
            </span>
            <span className="text-xs text-secondary-foreground">
              {showAdvanced ? "On" : "Off"}
            </span>
          </span>
          <Switch
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
            aria-label="Advanced controls"
          />
        </label>
      </section>

      {fermentationWorkspaceOpen && recipeDocument.ok ? (
        <FermentationPlanner document={recipeDocument.value} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-7 xl:col-span-8">
          <div className="surface-workbench overflow-hidden">
            <div data-onboarding-target="geometry">
              <Bench eyebrow="01 / Size" title="How much pizza are you making?">
                <SizeControls sizing={result?.sizing ?? null} />
              </Bench>
            </div>

            <div data-onboarding-target="formula">
              <Bench eyebrow="02 / Dough" title="Choose your dough">
                <FormulaControls />
              </Bench>
            </div>
          </div>

          {showAdvanced ? (
            <div className="surface-workbench overflow-hidden motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-top-1">
              <div className="flex items-center justify-between border-b-[0.5px] border-graphite px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <WrenchIcon
                    aria-hidden="true"
                    className="size-3.5 text-acid-lime"
                  />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
                      Precision layer
                    </span>
                    <h2 className="text-base font-medium">
                      Advanced configuration
                    </h2>
                  </div>
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

        <aside className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
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
