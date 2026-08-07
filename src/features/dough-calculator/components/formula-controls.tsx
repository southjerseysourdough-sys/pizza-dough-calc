"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { presetsForShape } from "../presets/formulas";
import { useCalculatorStore } from "../store/calculator-store";
import type { FatType, LeaveningMethod } from "../types/dough";
import { NumericField } from "./numeric-field";
import { ChoiceChips } from "./step-section";

/**
 * The dough step: which style, how wet, what raises it.
 *
 * The beginner path exposes only decisions with an obvious recipe impact.
 * Baker's-percentage tuning remains available in the precision layer.
 */

const FAT_TYPE_LABELS: Record<FatType, string> = {
  none: "No oil or fat",
  "olive-oil": "Olive oil",
  "neutral-oil": "Neutral oil",
  tallow: "Tallow",
};

const LEAVENING_LABELS: Record<LeaveningMethod, string> = {
  "commercial-yeast": "Instant dry yeast",
  sourdough: "Sourdough starter",
  hybrid: "Starter + yeast (advanced)",
};

/**
 * Plain-language read of a hydration figure.
 *
 * Percentages mean nothing to someone making their first dough; how the dough
 * will feel in their hands does. The bands are rules of thumb for pizza dough,
 * not thresholds the calculator enforces.
 */
function hydrationFeel(hydrationPercent: number): string {
  if (!Number.isFinite(hydrationPercent)) return "";
  if (hydrationPercent < 58) return "Stiff dough — easy to handle, crisp crust";
  if (hydrationPercent < 65)
    return "Classic dough — stretches without fighting";
  if (hydrationPercent < 72) return "Soft dough — open, airy crumb";
  return "Wet dough — sticky, worth wet hands and a bench scraper";
}

export function FormulaControls() {
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const presetId = useCalculatorStore((state) => state.presetId);
  const applyPreset = useCalculatorStore((state) => state.applyPreset);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);

  const usesYeast = values.leaveningMethod !== "sourdough";
  const usesStarter = values.leaveningMethod !== "commercial-yeast";
  const leaveningOptions = showAdvanced
    ? Object.entries(LEAVENING_LABELS)
    : Object.entries(LEAVENING_LABELS).filter(([value]) => value !== "hybrid");

  const availablePresets = presetsForShape(values.shape);
  const activePreset = availablePresets.find(
    (preset) => preset.id === presetId
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <ChoiceChips
          name="dough-style"
          legend="Dough style"
          value={presetId}
          options={availablePresets.map((preset) => ({
            value: preset.id,
            label: preset.shortName,
          }))}
          onChange={applyPreset}
          className="grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]"
        />
        {activePreset ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {activePreset.description}
          </p>
        ) : null}
      </div>

      <NumericField
        label="Hydration"
        unit="%"
        value={values.hydrationPercent}
        min={45}
        max={95}
        step={0.5}
        showRange
        hint={hydrationFeel(values.hydrationPercent)}
        help={{
          term: "Hydration",
          definition: "The total formula water divided by total formula flour.",
          effect:
            "Higher values generally make dough softer and more extensible.",
          current: `${values.hydrationPercent}% hydration`,
        }}
        onChange={(hydrationPercent) => setValues({ hydrationPercent })}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="leavening-method">What will raise the dough?</Label>
        <Select
          value={values.leaveningMethod}
          onValueChange={(next) => {
            if (typeof next !== "string") return;
            setValues({
              leaveningMethod: next as LeaveningMethod,
              // Commercial formulas intentionally use one clear standard.
              yeastType: "instant-dry",
            });
          }}
          items={LEAVENING_LABELS}
        >
          <SelectTrigger id="leavening-method" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leaveningOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {usesYeast
            ? `The recipe uses instant dry yeast. The ${values.yeastPercent}% amount comes from your selected style.`
            : "The calculator subtracts the flour and water already present in your starter."}
        </p>
      </div>

      {usesStarter ? (
        <NumericField
          label="Starter amount"
          unit="%"
          value={values.starterPercent}
          min={0}
          max={60}
          step={1}
          hint="Changes the starter, flour, and water amounts in the recipe."
          help={{
            term: "Starter percentage",
            definition: "The ripe starter used relative to total flour.",
            effect:
              "It changes the amount of prefermented flour and the main-dough flour and water weigh-out.",
            current: `${values.starterPercent}% starter`,
          }}
          onChange={(starterPercent) => setValues({ starterPercent })}
        />
      ) : null}

      {showAdvanced ? (
        <div className="surface-instrument flex flex-col gap-4 p-4">
          <div>
            <h3 className="text-sm font-medium">Baker controls</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Every value here changes an ingredient amount in your recipe.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumericField
              label="Salt"
              unit="%"
              value={values.saltPercent}
              min={0}
              max={5}
              step={0.1}
              onChange={(saltPercent) => setValues({ saltPercent })}
            />

            {usesYeast ? (
              <NumericField
                label="Instant dry yeast"
                unit="%"
                value={values.yeastPercent}
                min={0}
                max={2}
                step={0.05}
                hint="A starting point; dough temperature and time also matter."
                onChange={(yeastPercent) => setValues({ yeastPercent })}
              />
            ) : null}

            {usesStarter ? (
              <NumericField
                label="Starter hydration"
                unit="%"
                value={values.starterHydrationPercent}
                min={40}
                max={200}
                step={5}
                hint="Water divided by flour inside your starter."
                help={{
                  term: "Starter hydration",
                  definition:
                    "The water-to-flour ratio inside the starter itself.",
                  effect:
                    "It reallocates flour and water between starter and main dough without changing true formula hydration.",
                  current: `${values.starterHydrationPercent}% starter hydration`,
                }}
                onChange={(starterHydrationPercent) =>
                  setValues({ starterHydrationPercent })
                }
              />
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="fat-type">Oil or fat</Label>
              <Select
                value={values.fatType}
                onValueChange={(next) => {
                  if (typeof next !== "string") return;
                  const fatType = next as FatType;
                  setValues({
                    fatType,
                    fatPercent:
                      fatType === "none"
                        ? 0
                        : values.fatPercent > 0
                          ? values.fatPercent
                          : 2,
                  });
                }}
                items={FAT_TYPE_LABELS}
              >
                <SelectTrigger id="fat-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FAT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {values.fatType !== "none" ? (
              <NumericField
                label={FAT_TYPE_LABELS[values.fatType]}
                unit="%"
                value={values.fatPercent}
                min={0}
                max={15}
                step={0.5}
                onChange={(fatPercent) => setValues({ fatPercent })}
              />
            ) : null}

            <NumericField
              label="Sugar"
              unit="%"
              value={values.sugarPercent}
              min={0}
              max={10}
              step={0.25}
              onChange={(sugarPercent) => setValues({ sugarPercent })}
            />
            <NumericField
              label="Malt"
              unit="%"
              value={values.maltPercent}
              min={0}
              max={5}
              step={0.1}
              onChange={(maltPercent) => setValues({ maltPercent })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
