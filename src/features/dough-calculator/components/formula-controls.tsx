"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalculatorStore } from "../store/calculator-store";
import type { FatType, LeaveningMethod } from "../types/dough";
import { NumericField } from "./numeric-field";

/**
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

export function FormulaControls() {
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);

  const usesYeast = values.leaveningMethod !== "sourdough";
  const usesStarter = values.leaveningMethod !== "commercial-yeast";
  const leaveningOptions = showAdvanced
    ? Object.entries(LEAVENING_LABELS)
    : Object.entries(LEAVENING_LABELS).filter(([value]) => value !== "hybrid");

  return (
    <div className="flex flex-col gap-6">
      <NumericField
        label="Hydration"
        unit="%"
        value={values.hydrationPercent}
        min={45}
        max={100}
        step={0.5}
        hint="More water makes a softer, more open dough."
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
            ? `The recipe uses instant dry yeast. The ${values.yeastPercent}% amount comes from your selected profile.`
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
