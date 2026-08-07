"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * The batch target: how many pizzas or pans the baker actually wants.
 *
 * This is the one number a home baker changes every single time they use the
 * calculator, so it gets a control sized to match — a wide typeable field
 * flanked by tap targets, rather than another slider in a stack of sliders.
 */

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 24;

function clamp(value: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(value)));
}

export function QuantityStepper({
  label,
  value,
  unitNoun,
  onChange,
  className,
}: {
  label: string;
  value: number;
  /** "pizza" or "pan", pluralised here. */
  unitNoun: string;
  onChange: (value: number) => void;
  className?: string;
}) {
  const inputId = useId();

  // Same draft-text approach as NumericField: an emptied field must be
  // reportable as NaN so validation can speak, rather than snapping to 1
  // under the baker's cursor.
  const [draft, setDraft] = useState(() => String(value));
  const [lastValue, setLastValue] = useState(value);

  if (!Object.is(value, lastValue)) {
    setLastValue(value);
    if (!Object.is(Number(draft), value)) setDraft(String(value));
  }

  const step = (delta: number) => {
    const base = Number.isFinite(value) ? value : MIN_QUANTITY;
    onChange(clamp(base + delta));
  };

  const atMin = !Number.isFinite(value) || value <= MIN_QUANTITY;
  const atMax = Number.isFinite(value) && value >= MAX_QUANTITY;

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <Label
        htmlFor={inputId}
        className="text-sm leading-tight font-medium text-foreground/90"
      >
        {label}
      </Label>

      <div className="flex items-stretch gap-2">
        <StepButton
          label={`Fewer ${unitNoun}s`}
          disabled={atMin}
          onClick={() => step(-1)}
        >
          <MinusIcon aria-hidden="true" className="size-4" />
        </StepButton>

        <div className="surface-inset flex h-12 min-w-0 flex-1 items-center justify-center gap-2 px-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            value={draft}
            min={MIN_QUANTITY}
            max={MAX_QUANTITY}
            step={1}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              onChange(next.trim() === "" ? Number.NaN : Number(next));
            }}
            className={cn(
              "tabular h-10 w-16 border-0 bg-transparent px-0 text-right text-xl font-semibold",
              "shadow-none focus-visible:border-0 focus-visible:ring-0",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            )}
          />
          <span
            aria-hidden="true"
            className="min-w-0 truncate text-sm text-muted-foreground"
          >
            {unitNoun}
            {value === 1 ? "" : "s"}
          </span>
        </div>

        <StepButton
          label={`More ${unitNoun}s`}
          disabled={atMax}
          onClick={() => step(1)}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-md border-[0.5px] border-graphite bg-inset text-foreground transition-colors",
        "hover:border-smoke hover:bg-obsidian",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-35"
      )}
    >
      {children}
    </button>
  );
}
