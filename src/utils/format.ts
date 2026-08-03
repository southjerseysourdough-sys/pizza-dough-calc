/**
 * Presentation-layer formatting helpers. Pure functions only — anything that
 * touches React, state, or the DOM belongs in `hooks/` or `lib/`.
 */

const DEFAULT_LOCALE = "en-US";

/** Formats a number with a fixed number of decimals, trimming trailing zeros. */
export function formatNumber(
  value: number,
  { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = {}
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

/** Formats a 0–1 ratio as a percentage string. */
export function formatPercent(
  ratio: number,
  { locale = DEFAULT_LOCALE, maximumFractionDigits = 1 } = {}
): string {
  if (!Number.isFinite(ratio)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
  }).format(ratio);
}

/** Formats grams, switching to kilograms once the value gets large. */
export function formatGrams(
  grams: number,
  { locale = DEFAULT_LOCALE } = {}
): string {
  if (!Number.isFinite(grams)) return "—";
  return grams >= 1000
    ? `${formatNumber(grams / 1000, { locale, maximumFractionDigits: 2 })} kg`
    : `${formatNumber(grams, { locale, maximumFractionDigits: 1 })} g`;
}
