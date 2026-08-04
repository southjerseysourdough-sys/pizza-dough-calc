"use client";

import { CheckIcon } from "lucide-react";

import SpotlightCard from "@/components/effects/SpotlightCard";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { CalculatorFormatMode } from "../store/calculator-store";

function RoundGlyph({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="size-9 shrink-0">
      <circle
        cx="18"
        cy="18"
        r="11"
        className={
          selected ? "fill-none stroke-acid-lime" : "fill-none stroke-fog"
        }
        strokeWidth="1"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        className={selected ? "fill-acid-lime" : "fill-fog"}
      />
      <path
        d="M3 18h30M18 3v30"
        className="fill-none stroke-graphite"
        strokeWidth="0.75"
        strokeDasharray="2 3"
      />
      <path
        d="M7 31h22M7 28v6M29 28v6"
        className={
          selected ? "fill-none stroke-acid-lime" : "fill-none stroke-smoke"
        }
        strokeWidth="1"
      />
    </svg>
  );
}

function RectangularGlyph({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 44 36" aria-hidden="true" className="h-9 w-11 shrink-0">
      <rect
        x="7"
        y="8"
        width="30"
        height="20"
        rx="2"
        className={
          selected ? "fill-none stroke-acid-lime" : "fill-none stroke-fog"
        }
        strokeWidth="1"
      />
      <path
        d="M12 8v20M17 8v20M22 8v20M27 8v20M32 8v20M7 13h30M7 18h30M7 23h30"
        className="fill-none stroke-graphite"
        strokeWidth="0.5"
      />
      <path
        d="M7 32h30M7 30v4M37 30v4"
        className={
          selected ? "fill-none stroke-acid-lime" : "fill-none stroke-smoke"
        }
        strokeWidth="1"
      />
    </svg>
  );
}

const FORMATS = [
  {
    value: "round" as const,
    title: "Round on steel",
    detail: "Diameter-led circular field",
    Glyph: RoundGlyph,
  },
  {
    value: "sheet-pan" as const,
    title: "Sicilian or sheet pan",
    detail: "Interior planar field",
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
    <fieldset className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 lg:grid-cols-1">
      <legend className="sr-only">Pizza format</legend>

      {FORMATS.map(({ value: format, title, detail, Glyph }) => {
        const selected = value === format;

        return (
          <SpotlightCard
            key={format}
            disabled={Boolean(prefersReducedMotion)}
            spotlightColor="color-mix(in oklch, var(--acid-lime) 14%, transparent)"
            className={cn(
              "rounded-md border-[0.5px] bg-inset ring-0",
              selected
                ? "border-acid-lime/70 bg-obsidian"
                : "border-graphite hover:border-smoke"
            )}
          >
            <label className="relative flex min-h-16 cursor-pointer flex-col items-start gap-1 px-3 py-2 text-left sm:flex-row sm:items-center sm:gap-3 sm:py-2.5">
              <input
                type="radio"
                name="pizza-format"
                value={format}
                checked={selected}
                onChange={() => onChange(format)}
                className="peer sr-only"
              />

              <span className="pointer-events-none absolute inset-0 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-acid-lime peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background" />
              <Glyph selected={selected} />

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm leading-tight font-medium break-words text-foreground">
                  {title}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground max-[400px]:sr-only">
                  {detail}
                </span>
              </span>

              <span
                className={cn(
                  "absolute top-2.5 right-2.5 flex size-5 shrink-0 items-center justify-center rounded-sm border sm:static sm:ml-auto",
                  selected
                    ? "border-acid-lime bg-acid-lime text-void"
                    : "border-smoke text-transparent"
                )}
              >
                {selected ? (
                  <span className="motion-safe:animate-in motion-safe:duration-150 motion-safe:zoom-in-75">
                    <CheckIcon aria-hidden="true" className="size-3" />
                  </span>
                ) : null}
              </span>
            </label>
          </SpotlightCard>
        );
      })}
    </fieldset>
  );
}
