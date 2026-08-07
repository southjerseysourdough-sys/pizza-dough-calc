"use client";

import { cn } from "@/lib/utils";

/**
 * One numbered step in the calculator flow.
 *
 * The whole page is a single ordered path — pick a shape, pick a size, say how
 * many, choose a dough — and each step announces its own position in it. The
 * number is decorative for screen readers because the heading already carries
 * the step in its text.
 */

export function StepSection({
  step,
  title,
  hint,
  action,
  children,
  className,
  ...rest
}: {
  step: number;
  title: string;
  hint?: string;
  /** Optional control pinned to the right of the heading. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"section">, "title">) {
  return (
    <section
      className={cn(
        "relative border-b-[0.5px] border-graphite p-5 last:border-b-0 sm:p-6",
        className
      )}
      aria-label={`Step ${step}: ${title}`}
      {...rest}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[0.5px] border-acid-lime/60 text-[11px] font-medium text-acid-lime"
        >
          {step}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-base leading-tight font-medium text-foreground">
            {title}
          </h2>
          {hint ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="sm:pl-9">{children}</div>
    </section>
  );
}

/**
 * A row of mutually exclusive choices.
 *
 * Radios rather than buttons: the browser then handles arrow-key movement
 * between options and announces "3 of 6" without any extra work.
 */
export function ChoiceChips<T extends string | number>({
  name,
  legend,
  value,
  options,
  onChange,
  className,
}: {
  name: string;
  legend: string;
  value: T | null;
  options: readonly {
    value: T;
    label: string;
    detail?: string;
  }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2",
        className
      )}
    >
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={String(option.value)}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border-[0.5px] px-2 py-2.5 text-center transition-colors",
              "focus-within:ring-2 focus-within:ring-acid-lime focus-within:ring-offset-2 focus-within:ring-offset-background",
              selected
                ? "border-acid-lime/70 bg-obsidian"
                : "border-graphite bg-inset hover:border-smoke"
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={selected}
              onChange={() => onChange(option.value)}
              // Named explicitly rather than left to the wrapping label: the
              // two text spans would otherwise run together into a single
              // unpunctuated string ("CustomAny size").
              aria-label={
                option.detail
                  ? `${option.label}, ${option.detail}`
                  : option.label
              }
              className="sr-only"
            />
            <span
              className={cn(
                "tabular text-sm leading-tight font-medium",
                selected ? "text-acid-lime" : "text-foreground"
              )}
            >
              {option.label}
            </span>
            {option.detail ? (
              <span className="text-[10px] leading-tight text-muted-foreground">
                {option.detail}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
