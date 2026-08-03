"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * A labelled number input, optionally paired with a slider.
 *
 * The number input is always present and always shows the current value: the
 * slider is a convenience, never the only way to set a figure. Both write to
 * the same source value, so they cannot disagree.
 */

type NumericFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Rendered after the input, e.g. "%" or "g". */
  unit?: string;
  /** Supplying all three turns on the paired slider. */
  min?: number;
  max?: number;
  step?: number;
  /** Explanatory text, linked to the input via aria-describedby. */
  hint?: string;
  disabled?: boolean;
  className?: string;
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
  disabled,
  className,
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
    // what is typed, so an external change (slider, preset) wins but typing
    // is never interrupted.
    if (!Object.is(Number(draft), value)) {
      setDraft(toDraft(value));
    }
  }

  const showSlider =
    min !== undefined && max !== undefined && Number.isFinite(value);

  const handleInputChange = (next: string) => {
    setDraft(next);
    // An empty field is reported as NaN so validation can say "enter a
    // number" rather than silently substituting a value.
    onChange(next.trim() === "" ? Number.NaN : Number(next));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
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
            className="tabular h-8 w-24 text-right"
          />
          {unit ? (
            <span
              aria-hidden="true"
              className="w-8 shrink-0 text-sm text-muted-foreground"
            >
              {unit}
            </span>
          ) : null}
        </div>
      </div>

      {showSlider ? (
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          // The visible Label is bound to the number input, so the slider
          // carries its own accessible name.
          aria-label={`${label} slider`}
          onValueChange={(next) => {
            if (typeof next === "number") onChange(next);
          }}
        />
      ) : null}

      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
