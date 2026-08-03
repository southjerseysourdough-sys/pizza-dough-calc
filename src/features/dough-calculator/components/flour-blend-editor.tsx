"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { findPreset } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";
import { useCalculatorStore } from "../store/calculator-store";
import type { DoughFormulaResult } from "../types/dough";
import {
  BLEND_PERCENT_DECIMALS,
  createRowId,
  normalizeFlourPercentages,
  sumPercentages,
} from "../utils/blend";
import { formatIngredientGrams, formatPercentage } from "../utils/format";

/**
 * Main Dough Flour Blend editor.
 *
 * The blend divides the flour the baker actually weighs into the mixing bowl.
 * Any flour already built into a sourdough starter is accounted for separately
 * by the engine and is deliberately outside this editor, because its
 * composition is unknowable unless the baker tells us.
 */

/** Offered as conveniences only — the field accepts any text. */
const FLOUR_SUGGESTIONS = [
  "Bread Flour",
  "High Gluten Flour",
  "All Purpose Flour",
  "Tipo 00",
  "Whole Wheat",
  "Type 85",
  "Semolina",
  "Rye",
  "Kamut",
] as const;

/** How far the total may sit from 100 before it is flagged. */
const TOTAL_TOLERANCE_PERCENT = 0.1;

function AccountingRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs text-muted-foreground">
        {label}
        {hint ? (
          <span className="ml-1 text-muted-foreground/80">{hint}</span>
        ) : null}
      </span>
      <span className="tabular text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function FlourBlendEditor({
  result,
}: {
  result: DoughFormulaResult | null;
}) {
  const listId = useId();
  const totalId = useId();
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);
  const presetId = useCalculatorStore((state) => state.presetId);

  const blend = values.flourBlend;
  const total = sumPercentages(blend.map((item) => item.percentage));
  const isBalanced = Math.abs(total - 100) <= TOTAL_TOLERANCE_PERCENT;
  const canRemove = blend.length > 1;

  // Gram weights come from the engine, which has already removed starter
  // flour. They are never stored — only read for display.
  const gramsById = new Map(
    (result?.flourBlend ?? []).map((flour) => [flour.id, flour.grams])
  );

  const updateRow = (
    index: number,
    patch: { name?: string; percentage?: number }
  ) => {
    setValues({
      flourBlend: blend.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    });
  };

  const addRow = () => {
    setValues({
      flourBlend: [
        ...blend,
        { id: createRowId("flour"), name: "", percentage: 0 },
      ],
    });
  };

  const removeRow = (index: number) => {
    if (!canRemove) return;
    setValues({ flourBlend: blend.filter((_, i) => i !== index) });
  };

  const normalize = () => {
    const normalized = normalizeFlourPercentages(
      blend.map((item) => item.percentage)
    );
    setValues({
      flourBlend: blend.map((item, i) => ({
        ...item,
        percentage: normalized[i],
      })),
    });
  };

  const resetToPreset = () => {
    const preset = findPreset(presetId);
    if (!preset) return;
    setValues({ flourBlend: presetToFormValues(preset).flourBlend });
  };

  // A new row starts empty, so offering another would just create two blanks.
  const hasEmptyRow = blend.some((item) => item.name.trim() === "");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        This blend applies to the flour added during mixing. Flour already
        contained in your starter is calculated separately.
      </p>

      <datalist id={listId}>
        {FLOUR_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <ul className="flex flex-col gap-3">
        {blend.map((flour, index) => {
          const grams = gramsById.get(flour.id);
          const rowLabel = flour.name.trim() || `flour ${index + 1}`;

          return (
            <li
              key={flour.id}
              className="surface-instrument flex flex-col gap-2 p-3 sm:flex-row sm:items-end sm:gap-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label
                  htmlFor={`${flour.id}-name`}
                  className="text-xs text-muted-foreground"
                >
                  Flour
                </Label>
                <Input
                  id={`${flour.id}-name`}
                  list={listId}
                  value={flour.name}
                  placeholder="e.g. Bread Flour"
                  autoComplete="off"
                  onChange={(event) =>
                    updateRow(index, { name: event.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`${flour.id}-percent`}
                    className="text-xs text-muted-foreground"
                  >
                    Share
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id={`${flour.id}-percent`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.5}
                      value={
                        Number.isFinite(flour.percentage)
                          ? flour.percentage
                          : ""
                      }
                      onChange={(event) =>
                        updateRow(index, {
                          percentage:
                            event.target.value.trim() === ""
                              ? Number.NaN
                              : Number(event.target.value),
                        })
                      }
                      className="tabular h-9 w-20 text-right"
                    />
                    <span
                      aria-hidden="true"
                      className="text-sm text-muted-foreground"
                    >
                      %
                    </span>
                  </div>
                </div>

                <div className="flex min-w-20 flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Weight</span>
                  <output
                    htmlFor={`${flour.id}-percent`}
                    className="tabular flex h-9 items-center justify-end text-sm font-medium"
                  >
                    {grams === undefined
                      ? "—"
                      : `${formatIngredientGrams(grams, "flour")} g`}
                  </output>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={!canRemove}
                  onClick={() => removeRow(index)}
                >
                  <Trash2Icon aria-hidden="true" />
                  {/* Names the specific row, so the action is unambiguous
                      when read out of context. */}
                  <span className="sr-only">Remove {rowLabel}</span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <PlusIcon aria-hidden="true" />
          Add flour
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={normalize}
          disabled={isBalanced}
        >
          Normalize to 100%
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetToPreset}>
          Reset to preset
        </Button>
      </div>

      <div
        id={totalId}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ring-1",
          isBalanced
            ? "bg-muted/50 text-foreground ring-border"
            : "bg-destructive/8 text-foreground ring-destructive/25"
        )}
      >
        <span className="font-medium">Blend total</span>
        <span className="tabular font-semibold">
          {total.toFixed(total % 1 === 0 ? 0 : BLEND_PERCENT_DECIMALS)}%
        </span>
      </div>

      {!isBalanced ? (
        // Text, not colour alone. role="alert" announces it as soon as the
        // total goes out of balance.
        <p role="alert" className="text-sm text-destructive">
          The blend must total 100%. It currently totals {total.toFixed(1)}%.
          Use Normalize to 100% to scale the rows proportionally.
        </p>
      ) : null}

      {hasEmptyRow ? (
        <p className="text-xs text-muted-foreground">
          Name every flour to keep the recipe readable.
        </p>
      ) : null}

      {result ? (
        <div className="surface-inset divide-y divide-hairline/30 px-3 py-1.5">
          <AccountingRow
            label="Total formula flour"
            value={`${formatIngredientGrams(result.totalFlourGrams, "flour")} g`}
          />
          <AccountingRow
            label="Flour in starter"
            value={
              result.starter
                ? `${formatIngredientGrams(result.starter.flourGrams, "flour")} g`
                : "0 g"
            }
            hint={result.starter ? undefined : "(no starter)"}
          />
          <AccountingRow
            label="Added flour"
            value={`${formatIngredientGrams(result.remainingFlourGrams, "flour")} g`}
            hint="← this blend"
          />
          <AccountingRow
            label="Main dough blend total"
            value={formatPercentage(total / 100)}
          />
        </div>
      ) : null}
    </div>
  );
}
