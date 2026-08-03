"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCalculatorPersistence,
  useDoughCalculation,
} from "../hooks/use-dough-calculation";
import { CALCULATOR_PRESETS, findPreset } from "../presets/formulas";
import { useCalculatorStore } from "../store/calculator-store";
import { CustomIngredientEditor } from "./custom-ingredient-editor";
import { FlourBlendEditor } from "./flour-blend-editor";
import { FormulaControls } from "./formula-controls";
import { IssueList } from "./issue-list";
import { MobileSummaryBar } from "./mobile-summary-bar";
import { RecipeSummary } from "./recipe-summary";
import { SizeControls } from "./size-controls";

/**
 * The calculator shell.
 *
 * Layout puts the controls and the live recipe side by side on wide screens,
 * with the recipe sticky so it stays in view while you work. On narrow screens
 * the recipe sits directly beneath the controls, still updating live.
 */

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {action}
      </div>
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
    // Bottom padding on small screens clears the fixed mobile summary bar.
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:pb-20">
      {/*
       * Deliberately no entrance animation on this wrapper. An earlier version
       * faded it in from opacity 0, which meant the server-rendered HTML
       * carried `opacity: 0` and the entire calculator stayed invisible until
       * JavaScript hydrated and finished animating. A tool has to be readable
       * the moment it paints. Motion is used for the warnings below instead,
       * where content appears in response to input and can never be hidden on
       * first paint.
       */}
      <div className="flex flex-col gap-5">
        <Panel
          title="What are you making?"
          action={
            <div className="flex items-center gap-2">
              <Label htmlFor="advanced-toggle" className="text-xs">
                Advanced
              </Label>
              <Switch
                id="advanced-toggle"
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            <Tabs
              value={formatMode}
              onValueChange={(next) => {
                if (next === "round" || next === "sheet-pan")
                  setFormatMode(next);
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="round">Round on steel</TabsTrigger>
                <TabsTrigger value="sheet-pan">
                  Sicilian or sheet pan
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2">
              <Label htmlFor="preset">Starting point</Label>
              <Select
                value={presetId}
                onValueChange={(next) => {
                  if (typeof next === "string") applyPreset(next);
                }}
                items={Object.fromEntries(
                  CALCULATOR_PRESETS.map((p) => [p.id, p.name])
                )}
              >
                <SelectTrigger id="preset" className="w-full">
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
                <p className="text-xs text-muted-foreground">
                  {preset.description} Every value is editable.
                </p>
              ) : null}
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-5">
            <Panel title="Size and equipment">
              <SizeControls sizing={result?.sizing ?? null} />
            </Panel>

            <Panel title="Dough formula">
              <FormulaControls />
            </Panel>

            {showAdvanced ? (
              <>
                <Panel title="Main Dough Flour Blend">
                  <FlourBlendEditor result={result} />
                </Panel>

                <Panel title="Custom ingredients">
                  <CustomIngredientEditor result={result} />
                </Panel>
              </>
            ) : null}

            {preset && preset.assumptions.length > 0 ? (
              <section className="rounded-xl bg-muted/40 p-5">
                <h2 className="mb-2 font-heading text-sm font-semibold">
                  What this starting point assumes
                </h2>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs text-muted-foreground">
                  {preset.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            {errors.length > 0 || fieldErrors.length > 0 ? (
              <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <h2 className="mb-3 font-heading text-base font-semibold">
                  Check these values
                </h2>
                <IssueList issues={errors.length > 0 ? errors : fieldErrors} />
              </div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                <RecipeSummary result={result} shape={values.shape} />
                {summaryWarnings.length > 0 ? (
                  <IssueList issues={summaryWarnings} />
                ) : null}
              </div>
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
