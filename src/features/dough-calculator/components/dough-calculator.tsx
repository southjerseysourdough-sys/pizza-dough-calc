"use client";

import { WrenchIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useCalculatorPersistence,
  useDoughCalculation,
} from "../hooks/use-dough-calculation";
import { CALCULATOR_PRESETS, findPreset } from "../presets/formulas";
import { useCalculatorStore } from "../store/calculator-store";
import { formatDoughLoading, formatPercentage } from "../utils/format";
import { CustomIngredientEditor } from "./custom-ingredient-editor";
import { DoughStage } from "./dough-stage";
import { FlourBlendEditor } from "./flour-blend-editor";
import { FormulaControls } from "./formula-controls";
import { IssueList } from "./issue-list";
import { MobileSummaryBar } from "./mobile-summary-bar";
import { RecipeSummary } from "./recipe-summary";
import { SizeControls } from "./size-controls";

/**
 * The calculator, in three deliberately unequal levels.
 *
 *  1. The dough stage — the live form and the headline weight.
 *  2. The workbench — controls, in an asymmetric grid beside the result.
 *  3. Formula details — blends, custom ingredients, preset assumptions.
 *
 * The three levels differ in surface, elevation and radius rather than being
 * the same card repeated, which is what stopped the previous version from
 * reading as a settings panel.
 */

/** A control group on the workbench. Level two. */
function Bench({
  title,
  eyebrow,
  children,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-workbench p-5", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          {eyebrow ? (
            <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground/75 uppercase">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="text-base leading-tight font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A quieter grouping for level three. Deliberately not a workbench card. */
function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline/40 pt-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground/85">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DoughCalculator() {
  useCalculatorPersistence();

  const presetId = useCalculatorStore((state) => state.presetId);
  const applyPreset = useCalculatorStore((state) => state.applyPreset);
  const formatMode = useCalculatorStore((state) => state.formatMode);
  const setFormatMode = useCalculatorStore((state) => state.setFormatMode);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);
  const setShowAdvanced = useCalculatorStore((state) => state.setShowAdvanced);
  const values = useCalculatorStore((state) => state.values);

  const { calculation, fieldErrors, surfaceWarning } = useDoughCalculation();
  const preset = findPreset(presetId);

  const result = calculation.ok ? calculation.result : null;
  const errors = calculation.ok ? [] : calculation.issues;
  const summaryWarnings = surfaceWarning ? [surfaceWarning] : [];

  return (
    <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-5 px-4 pb-28 sm:px-6 lg:pb-16">
      {/* LEVEL ONE */}
      <DoughStage
        values={values}
        formatMode={formatMode}
        onFormatChange={setFormatMode}
        result={result}
        presetName={preset?.name ?? ""}
      />

      {/* LEVEL TWO — asymmetric workbench. */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <Bench
            eyebrow="Starting point"
            title="Recipe profile"
            action={
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <WrenchIcon
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Advanced
                </span>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                  aria-label="Advanced controls"
                />
              </label>
            }
          >
            <div className="flex flex-col gap-3">
              <Label htmlFor="preset" className="sr-only">
                Starting point
              </Label>
              <Select
                value={presetId}
                onValueChange={(next) => {
                  if (typeof next === "string") applyPreset(next);
                }}
                items={Object.fromEntries(
                  CALCULATOR_PRESETS.map((p) => [p.id, p.name])
                )}
              >
                <SelectTrigger id="preset" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALCULATOR_PRESETS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {preset ? (
                <>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {preset.description}{" "}
                    <span className="text-foreground/70">
                      Every value below is editable.
                    </span>
                  </p>
                  {/* Key values of the current profile, as an at-a-glance
                      readout rather than something to hunt for. */}
                  <div className="surface-inset flex flex-wrap gap-x-6 gap-y-2 px-3 py-2.5">
                    <ProfileStat
                      label="Hydration"
                      value={formatPercentage(values.hydrationPercent / 100)}
                    />
                    <ProfileStat
                      label="Salt"
                      value={formatPercentage(values.saltPercent / 100)}
                    />
                    <ProfileStat
                      label="Loading"
                      value={formatDoughLoading(
                        values.doughLoadingGramsPerSquareInch
                      )}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </Bench>

          <Bench eyebrow="Geometry" title="Size and equipment">
            <SizeControls sizing={result?.sizing ?? null} />
          </Bench>

          <Bench eyebrow="Formula" title="Dough formula">
            <FormulaControls />
          </Bench>

          {/* LEVEL THREE — quieter, grouped, not more cards. */}
          {showAdvanced ? (
            <div className="surface-workbench flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-ember uppercase">
                  Baker&rsquo;s toolbox
                </span>
                <h2 className="text-base leading-tight font-semibold">
                  Formula details
                </h2>
              </div>

              <DetailBlock title="Main Dough Flour Blend">
                <FlourBlendEditor result={result} />
              </DetailBlock>

              <DetailBlock title="Custom ingredients">
                <CustomIngredientEditor result={result} />
              </DetailBlock>
            </div>
          ) : null}

          {preset && preset.assumptions.length > 0 ? (
            <section className="px-1">
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                What this starting point assumes
              </h2>
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                {preset.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* The result rides alongside the controls and stays in view. */}
        <div className="lg:col-span-5">
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            {errors.length > 0 || fieldErrors.length > 0 ? (
              <div className="surface-workbench p-5">
                <h2 className="mb-3 text-base font-semibold">
                  Check these values
                </h2>
                <IssueList issues={errors.length > 0 ? errors : fieldErrors} />
              </div>
            ) : result ? (
              <>
                <RecipeSummary
                  result={result}
                  shape={values.shape}
                  styleLabel={preset?.name ?? ""}
                />
                {summaryWarnings.length > 0 ? (
                  <IssueList issues={summaryWarnings} />
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {result ? (
        <MobileSummaryBar result={result} shape={values.shape} />
      ) : null}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.6rem] font-medium tracking-[0.1em] text-muted-foreground/80 uppercase">
        {label}
      </span>
      <span className="tabular text-xs font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}
