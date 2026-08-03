"use client";

import { CheckIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { CalculatorFormatMode } from "../store/calculator-store";

/**
 * Format selection as two physical choices rather than a segmented bar.
 *
 * Each card carries its own geometry — a circle on a steel plate, a rectangle
 * in a rimmed pan — so the two modes are told apart by shape before colour.
 * Selection is conveyed four ways at once: the shape fills in, the border
 * thickens, a check appears, and the text weight changes, so it survives
 * greyscale and colour blindness.
 *
 * Implemented as a real radio group, so arrow keys move between options and
 * the current choice is announced without any custom key handling.
 */

/** Round pizza on a steel plate, drawn rather than shipped as an icon file. */
function RoundGlyph({ selected }: { selected: boolean }) {
  return (
    <svg
      viewBox="0 0 56 40"
      aria-hidden="true"
      className="h-10 w-14 shrink-0 overflow-visible"
    >
      {/* Steel plate, seen in perspective. */}
      <ellipse
        cx="28"
        cy="26"
        rx="24"
        ry="9"
        className={cn(
          "transition-colors",
          selected ? "fill-steel/25" : "fill-muted-foreground/12"
        )}
      />
      <ellipse
        cx="28"
        cy="24"
        rx="24"
        ry="9"
        className={cn(
          "transition-colors",
          selected ? "fill-steel/35" : "fill-muted-foreground/18"
        )}
      />
      {/* The pizza itself. */}
      <circle
        cx="28"
        cy="18"
        r="12"
        className={cn(
          "transition-all",
          selected
            ? "fill-ember/35 stroke-ember"
            : "fill-transparent stroke-muted-foreground/45"
        )}
        strokeWidth={selected ? 2 : 1.5}
      />
      {/* Diameter marker: the value this mode is driven by. */}
      <line
        x1="16"
        y1="18"
        x2="40"
        y2="18"
        strokeDasharray="2 2"
        className={cn(
          "transition-colors",
          selected ? "stroke-ember" : "stroke-muted-foreground/40"
        )}
        strokeWidth="1"
      />
    </svg>
  );
}

/** Rectangular dough in a rimmed sheet pan. */
function RectangularGlyph({ selected }: { selected: boolean }) {
  return (
    <svg
      viewBox="0 0 56 40"
      aria-hidden="true"
      className="h-10 w-14 shrink-0 overflow-visible"
    >
      {/* Pan rim. */}
      <rect
        x="5"
        y="9"
        width="46"
        height="26"
        rx="3"
        className={cn(
          "transition-colors",
          selected
            ? "fill-steel/25 stroke-steel/60"
            : "fill-muted-foreground/10 stroke-muted-foreground/30"
        )}
        strokeWidth="1.5"
      />
      {/* Dough filling the interior. */}
      <rect
        x="9"
        y="13"
        width="38"
        height="18"
        rx="2"
        className={cn(
          "transition-all",
          selected
            ? "fill-ember/35 stroke-ember"
            : "fill-transparent stroke-muted-foreground/45"
        )}
        strokeWidth={selected ? 2 : 1.5}
      />
      {/* Interior dimension markers. */}
      <line
        x1="9"
        y1="35.5"
        x2="47"
        y2="35.5"
        strokeDasharray="2 2"
        className={cn(
          "transition-colors",
          selected ? "stroke-ember" : "stroke-muted-foreground/40"
        )}
        strokeWidth="1"
      />
    </svg>
  );
}

const FORMATS = [
  {
    value: "round" as const,
    title: "Round on steel",
    detail: "Diameter · direct bake",
    Glyph: RoundGlyph,
  },
  {
    value: "sheet-pan" as const,
    title: "Sicilian or sheet pan",
    detail: "Interior size · pan loading",
    Glyph: RectangularGlyph,
  },
];

export function FormatCards({
  value,
  onChange,
}: {
  value: CalculatorFormatMode;
  onChange: (mode: CalculatorFormatMode) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <fieldset className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <legend className="sr-only">Pizza format</legend>

      {FORMATS.map(({ value: format, title, detail, Glyph }) => {
        const selected = value === format;

        return (
          <label
            key={format}
            className={cn(
              "group relative flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors",
              "focus-within:ring-3 focus-within:ring-ring/50 focus-within:outline-none",
              selected
                ? "border-2 border-ember/55 bg-accent/45 shadow-[var(--shadow-instrument)]"
                : "border border-hairline/50 bg-inset/45 hover:border-hairline hover:bg-inset/70"
            )}
          >
            <input
              type="radio"
              name="pizza-format"
              value={format}
              checked={selected}
              onChange={() => onChange(format)}
              className="sr-only"
            />

            <Glyph selected={selected} />

            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm leading-tight",
                  selected
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/80"
                )}
              >
                {title}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">
                {detail}
              </span>
            </span>

            {selected ? (
              <motion.span
                // Shared layout id slides the marker between the two cards.
                layoutId={prefersReducedMotion ? undefined : "format-check"}
                className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-ember text-primary-foreground"
              >
                <CheckIcon aria-hidden="true" className="size-3" />
              </motion.span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
