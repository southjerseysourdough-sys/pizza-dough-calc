"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ContextHelp, type ContextHelpContent } from "./context-help";

/**
 * A measurement instrument: a label, a value capsule, and an optional rail.
 *
 * The capsule is a real editable input styled as an instrument readout — the
 * precise value is always visible and always typeable. The rail is a
 * convenience for coarse adjustment, never the only way to set a figure, and
 * the two write to the same source value so they cannot disagree.
 */

type NumericFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Rendered inside the capsule, e.g. "%" or "in". */
  unit?: string;
  /** Supplying both turns on the paired rail. */
  min?: number;
  max?: number;
  step?: number;
  /** Explanatory text, linked to the input via aria-describedby. */
  hint?: string;
  /** Shows the rail's end values, useful when the range is not obvious. */
  showRange?: boolean;
  disabled?: boolean;
  className?: string;
  help?: ContextHelpContent;
};

function toDraft(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

export function NumericField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  hint,
  showRange = false,
  disabled,
  className,
  help,
}: NumericFieldProps) {
  const inputId = useId();
  const hintId = useId();

  // The input keeps its own text so part-typed values such as "2." or "0.0"
  // survive keystrokes. React's documented pattern for adjusting state when a
  // prop changes, rather than an effect.
  const [draft, setDraft] = useState(() => toDraft(value));
  const [lastValue, setLastValue] = useState(value);

  // Object.is rather than !==, because clearing the field reports NaN and
  // `NaN !== NaN` is always true. With a plain comparison this block would
  // set state on every render and React would abort with "Too many
  // re-renders" the moment someone emptied an input.
  if (!Object.is(value, lastValue)) {
    setLastValue(value);
    // Only overwrite the text when the incoming value genuinely disagrees with
    // what is typed, so an external change (rail, preset) wins but typing
    // is never interrupted.
    if (!Object.is(Number(draft), value)) {
      setDraft(toDraft(value));
    }
  }

  const showRail =
    min !== undefined && max !== undefined && Number.isFinite(value);

  const handleInputChange = (next: string) => {
    setDraft(next);
    // An empty field is reported as NaN so validation can say "enter a
    // number" rather than silently substituting a value.
    onChange(next.trim() === "" ? Number.NaN : Number(next));
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1">
          <Label
            htmlFor={inputId}
            className="text-sm leading-tight font-medium text-foreground/90"
          >
            {label}
          </Label>
          {help ? <ContextHelp content={help} /> : null}
        </span>

        {/*
         * The value capsule. Focus-within moves the ring onto the whole
         * capsule so it reads as one control rather than a bare box.
         */}
        <div
          className={cn(
            "surface-inset flex h-9 shrink-0 items-center gap-1 py-0 pr-2.5 pl-1",
            "transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
            disabled && "opacity-50"
          )}
        >
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            value={draft}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-describedby={hint ? hintId : undefined}
            onChange={(event) => handleInputChange(event.target.value)}
            className={cn(
              "tabular h-8 w-[4.5rem] border-0 bg-transparent px-1.5 text-right text-[0.95rem] font-semibold",
              "shadow-none focus-visible:border-0 focus-visible:ring-0",
              // The browser's spinner arrows fight the instrument look.
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            )}
          />
          {unit ? (
            <span
              aria-hidden="true"
              className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground"
            >
              {unit}
            </span>
          ) : null}
        </div>
      </div>

      {showRail ? (
        <div className="flex flex-col gap-1">
          <Slider
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            // The visible Label is bound to the number input, so the rail
            // carries its own accessible name.
            aria-label={`${label} slider`}
            onValueChange={(next) => {
              if (typeof next === "number") onChange(next);
            }}
          />
          {showRange ? (
            <div
              aria-hidden="true"
              className="tabular flex justify-between text-[0.65rem] text-muted-foreground/70"
            >
              <span>{min}</span>
              <span>{max}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {hint ? (
        <p id={hintId} className="text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
