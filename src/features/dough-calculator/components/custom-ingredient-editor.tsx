"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalculatorStore } from "../store/calculator-store";
import type { DoughFormulaResult } from "../types/dough";
import { createRowId } from "../utils/blend";
import { formatIngredientGrams } from "../utils/format";
import { isReservedIngredientName } from "../utils/form-values";

/**
 * Custom ingredient editor.
 *
 * Surfaces the engine's existing custom-ingredient support. Each entry is a
 * baker's percentage of total flour, so it participates in the percentage sum
 * and therefore in total flour, the dough mass and the recipe summary exactly
 * like any built-in ingredient.
 */
export function CustomIngredientEditor({
  result,
}: {
  result: DoughFormulaResult | null;
}) {
  const values = useCalculatorStore((state) => state.values);
  const setValues = useCalculatorStore((state) => state.setValues);

  const ingredients = values.customIngredients;

  const gramsById = new Map(
    (result?.ingredients ?? [])
      .filter((ingredient) => ingredient.kind === "custom")
      .map((ingredient) => [ingredient.id, ingredient.grams])
  );

  const updateRow = (
    index: number,
    patch: { name?: string; percentage?: number }
  ) => {
    setValues({
      customIngredients: ingredients.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    });
  };

  const addRow = () => {
    setValues({
      customIngredients: [
        ...ingredients,
        { id: createRowId("custom"), name: "", percentage: 0 },
      ],
    });
  };

  const removeRow = (index: number) => {
    setValues({
      customIngredients: ingredients.filter((_, i) => i !== index),
    });
  };

  // Adding another row while one is still blank would just stack up empties.
  const hasEmptyRow = ingredients.some((item) => item.name.trim() === "");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Percentages are relative to total flour, the same as every other
        ingredient. Anything added here is included in the dough weight and the
        recipe summary.
      </p>

      {ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom ingredients yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ingredients.map((ingredient, index) => {
            const grams = gramsById.get(ingredient.id);
            const rowLabel =
              ingredient.name.trim() || `ingredient ${index + 1}`;
            const isReserved = isReservedIngredientName(ingredient.name);

            return (
              <li
                key={ingredient.id}
                className="surface-instrument flex flex-col gap-2 p-3 sm:flex-row sm:items-end sm:gap-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Label
                    htmlFor={`${ingredient.id}-name`}
                    className="text-xs text-muted-foreground"
                  >
                    Ingredient
                  </Label>
                  <Input
                    id={`${ingredient.id}-name`}
                    value={ingredient.name}
                    placeholder="e.g. Milk Powder"
                    autoComplete="off"
                    aria-invalid={isReserved || undefined}
                    aria-describedby={
                      isReserved ? `${ingredient.id}-error` : undefined
                    }
                    onChange={(event) =>
                      updateRow(index, { name: event.target.value })
                    }
                    className="h-9"
                  />
                  {isReserved ? (
                    <p
                      id={`${ingredient.id}-error`}
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      The formula already tracks {ingredient.name.trim()}{" "}
                      separately. Use a different name.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`${ingredient.id}-percent`}
                      className="text-xs text-muted-foreground"
                    >
                      Baker&rsquo;s %
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id={`${ingredient.id}-percent`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        value={
                          Number.isFinite(ingredient.percentage)
                            ? ingredient.percentage
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
                    <span className="text-xs text-muted-foreground">
                      Weight
                    </span>
                    <output
                      htmlFor={`${ingredient.id}-percent`}
                      className="tabular flex h-9 items-center justify-end text-sm font-medium"
                    >
                      {grams === undefined
                        ? "—"
                        : `${formatIngredientGrams(grams, "custom")} g`}
                    </output>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2Icon aria-hidden="true" />
                    <span className="sr-only">Remove {rowLabel}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={hasEmptyRow}
          onClick={addRow}
        >
          <PlusIcon aria-hidden="true" />
          Add ingredient
        </Button>
        {hasEmptyRow ? (
          <p className="text-xs text-muted-foreground">
            Name the empty ingredient before adding another.
          </p>
        ) : null}
      </div>
    </div>
  );
}
