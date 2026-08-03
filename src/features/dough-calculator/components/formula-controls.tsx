"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CommercialYeastType,
  FatType,
  LeaveningMethod,
} from "../types/dough";
import { useCalculatorStore } from "../store/calculator-store";
import { NumericField } from "./numeric-field";

/**
 * Dough formula controls.
 *
 * Everything a normal home baker needs stays visible; the finer levers are
 * behind the advanced toggle. Nothing required to understand the recipe is
 * hidden.
 */

const FAT_TYPE_LABELS: Record<FatType, string> = {
  none: "No fat",
  "olive-oil": "Olive oil",
  "neutral-oil": "Neutral oil",
  tallow: "Tallow",
};

const LEAVENING_LABELS: Record<LeaveningMethod, string> = {
  "commercial-yeast": "Commercial yeast",
  sourdough: "Sourdough starter",
  hybrid: "Both (hybrid)",
};

const YEAST_TYPE_LABELS: Record<CommercialYeastType, string> = {
  "instant-dry": "Instant dry",
  "active-dry": "Active dry",
  fresh: "Fresh",
};

export function FormulaControls() {
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);

  const usesYeast = values.leaveningMethod !== "sourdough";
  const usesStarter = values.leaveningMethod !== "commercial-yeast";

  return (
    <div className="flex flex-col gap-6">
      <NumericField
        label="Hydration"
        unit="%"
        value={values.hydrationPercent}
        min={45}
        max={100}
        step={0.5}
        hint="Water as a percentage of total flour."
        help={{
          term: "Hydration",
          definition: "The total formula water divided by total formula flour.",
          effect:
            "Higher values generally make dough softer and more extensible.",
          current: `${values.hydrationPercent}% hydration`,
        }}
        onChange={(hydrationPercent) => setValues({ hydrationPercent })}
      />

      <NumericField
        label="Salt"
        unit="%"
        value={values.saltPercent}
        min={0}
        max={5}
        step={0.1}
        onChange={(saltPercent) => setValues({ saltPercent })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fat-type">Fat type</Label>
          <Select
            value={values.fatType}
            onValueChange={(next) => {
              if (typeof next === "string")
                setValues({ fatType: next as FatType });
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

        <NumericField
          label="Fat"
          unit="%"
          value={values.fatPercent}
          min={0}
          max={15}
          step={0.5}
          disabled={values.fatType === "none"}
          onChange={(fatPercent) => setValues({ fatPercent })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="leavening-method">Leavening</Label>
        <Select
          value={values.leaveningMethod}
          onValueChange={(next) => {
            if (typeof next === "string")
              setValues({ leaveningMethod: next as LeaveningMethod });
          }}
          items={LEAVENING_LABELS}
        >
          <SelectTrigger id="leavening-method" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAVENING_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usesYeast ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="yeast-type">Yeast type</Label>
            <Select
              value={values.yeastType}
              onValueChange={(next) => {
                if (typeof next === "string")
                  setValues({ yeastType: next as CommercialYeastType });
              }}
              items={YEAST_TYPE_LABELS}
            >
              <SelectTrigger id="yeast-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(YEAST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <NumericField
            label="Yeast"
            unit="%"
            value={values.yeastPercent}
            min={0}
            max={2}
            step={0.05}
            hint="A starting point, not a guarantee."
            onChange={(yeastPercent) => setValues({ yeastPercent })}
          />
        </div>
      ) : null}

      {usesStarter ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            label="Starter"
            unit="%"
            value={values.starterPercent}
            min={0}
            max={60}
            step={1}
            hint="Starter weight as a percentage of total flour."
            help={{
              term: "Starter percentage",
              definition: "The ripe starter used relative to total flour.",
              effect:
                "It changes the amount of prefermented flour and the main-dough flour and water weigh-out.",
              current: `${values.starterPercent}% starter`,
            }}
            onChange={(starterPercent) => setValues({ starterPercent })}
          />
          {showAdvanced ? (
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
        </div>
      ) : null}

      {showAdvanced ? (
        <div className="surface-instrument grid gap-4 p-4 sm:grid-cols-2">
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
      ) : null}
    </div>
  );
}
