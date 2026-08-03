"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * Three-way theme control: system, light, dark.
 *
 * Built as a radio group rather than a single cycling button so the current
 * choice is announced, all three options are reachable, and "system" stays a
 * first-class option instead of being buried. Arrow keys move between options
 * natively because these are real radio inputs; the visible control is the
 * label, so each remains a full-size click and touch target.
 */

const THEME_OPTIONS = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // Before mount the resolved theme is unknown, so no option is marked
  // selected. Rendering the same markup either way keeps the server and client
  // trees identical and avoids a layout shift.
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <fieldset className="flex items-center gap-0.5 rounded-lg bg-muted/70 p-0.5">
      <legend className="sr-only">Colour theme</legend>

      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const isSelected = current === value;

        return (
          <label
            key={value}
            className={cn(
              "relative flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors",
              "hover:text-foreground",
              // Focus ring is driven by the visually hidden input inside.
              "focus-within:ring-3 focus-within:ring-ring/50 focus-within:outline-none",
              isSelected && "bg-background text-foreground shadow-sm"
            )}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={isSelected ?? false}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" />
            <span className="sr-only">{label} theme</span>
          </label>
        );
      })}
    </fieldset>
  );
}
