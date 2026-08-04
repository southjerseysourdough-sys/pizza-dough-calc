"use client";

import { CheckIcon, TypeIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ReadingFont = "geist" | "atkinson" | "plex";
type TextSize = "standard" | "comfortable" | "large";

type ReadabilityPreference = {
  font: ReadingFont;
  size: TextSize;
};

const STORAGE_KEY = "pdc:readability";
const DEFAULT_PREFERENCE: ReadabilityPreference = {
  font: "atkinson",
  size: "comfortable",
};

const FONT_OPTIONS: ReadonlyArray<{
  value: ReadingFont;
  label: string;
  detail: string;
  family: string;
}> = [
  {
    value: "atkinson",
    label: "Atkinson",
    detail: "Clearest letter shapes",
    family: "var(--font-atkinson)",
  },
  {
    value: "plex",
    label: "IBM Plex",
    detail: "Technical and open",
    family: "var(--font-ibm-plex)",
  },
  {
    value: "geist",
    label: "Geist",
    detail: "Compact original",
    family: "var(--font-geist-sans)",
  },
];

const SIZE_OPTIONS: ReadonlyArray<{
  value: TextSize;
  label: string;
  detail: string;
}> = [
  { value: "standard", label: "Standard", detail: "100%" },
  { value: "comfortable", label: "Comfortable", detail: "112%" },
  { value: "large", label: "Large", detail: "125%" },
];

function isReadingFont(value: unknown): value is ReadingFont {
  return FONT_OPTIONS.some((option) => option.value === value);
}

function isTextSize(value: unknown): value is TextSize {
  return SIZE_OPTIONS.some((option) => option.value === value);
}

function readPreference(): ReadabilityPreference {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      font?: unknown;
      size?: unknown;
    };
    return {
      font: isReadingFont(parsed.font) ? parsed.font : DEFAULT_PREFERENCE.font,
      size: isTextSize(parsed.size) ? parsed.size : DEFAULT_PREFERENCE.size,
    };
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

function applyPreference(preference: ReadabilityPreference) {
  document.documentElement.dataset.readingFont = preference.font;
  document.documentElement.dataset.textSize = preference.size;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // The preference still works for this visit when storage is unavailable.
  }
}

export function ReadabilitySettings() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ReadabilityPreference>(() =>
    typeof window === "undefined" ? DEFAULT_PREFERENCE : readPreference()
  );

  useEffect(() => {
    applyPreference(preference);
  }, [preference]);

  const update = (patch: Partial<ReadabilityPreference>) => {
    const next = { ...preference, ...patch };
    setPreference(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-md"
        aria-label="Reading settings"
        onClick={() => setOpen(true)}
      >
        <TypeIcon />
        <span className="hidden xl:inline">Text</span>
      </Button>

      <DialogContent className="gap-5 border-[0.5px] border-graphite bg-carbon sm:max-w-lg">
        <DialogHeader>
          <span className="font-mono text-[10px] tracking-[0.1em] text-acid-lime uppercase">
            Readability
          </span>
          <DialogTitle className="text-xl">
            Make the app easier to read
          </DialogTitle>
          <DialogDescription>
            Font and text size update immediately and stay saved on this device.
          </DialogDescription>
        </DialogHeader>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Font</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {FONT_OPTIONS.map((option) => {
              const selected = preference.font === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative flex min-h-24 cursor-pointer flex-col justify-between rounded-lg border-[0.5px] p-3",
                    selected
                      ? "border-acid-lime bg-inset"
                      : "border-graphite hover:border-smoke"
                  )}
                  style={{ fontFamily: option.family }}
                >
                  <input
                    type="radio"
                    name="reading-font"
                    value={option.value}
                    checked={selected}
                    onChange={() => update({ font: option.value })}
                    className="peer sr-only"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                  <span className="flex items-center justify-between gap-2 text-base font-semibold">
                    Aa
                    {selected ? (
                      <CheckIcon className="size-4 text-acid-lime" />
                    ) : null}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.detail}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Text size</legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_OPTIONS.map((option) => {
              const selected = preference.size === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-lg border-[0.5px] text-center",
                    selected
                      ? "border-acid-lime bg-inset"
                      : "border-graphite hover:border-smoke"
                  )}
                >
                  <input
                    type="radio"
                    name="text-size"
                    value={option.value}
                    checked={selected}
                    onChange={() => update({ size: option.value })}
                    className="peer sr-only"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {option.detail}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-lg border-[0.5px] border-graphite bg-inset p-4">
          <p className="text-base leading-relaxed">
            Mix 334 g flour with 210 g water. The recipe stays precise while
            every label remains comfortable to read.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
