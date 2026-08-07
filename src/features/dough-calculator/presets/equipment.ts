import type { PanProfile, SteelProfile } from "../types/equipment";

/**
 * Equipment profiles.
 *
 * Dimensions are metadata for fit guidance only. Nothing in this file may
 * influence hydration, salt, yeast, fat, or dough weight.
 */

/**
 * Published Baking Steel Plus specification: 15" x 20" x 1/4" thick, 22 lbs.
 * Source: https://bakingsteel.com/products/baking-steel-plus
 */
export const BAKING_STEEL_PLUS: SteelProfile = {
  id: "baking-steel-plus",
  name: "Baking Steel Plus",
  widthInches: 20,
  depthInches: 15,
  thicknessInches: 0.25,
  weightPounds: 22,
  sourceUrl: "https://bakingsteel.com/products/baking-steel-plus",
  description:
    "Manufacturer published dimensions. The 15 inch side is what limits round pizza diameter.",
};

/**
 * Generic fallbacks for hardware we have no published figures for. Dimensions
 * are zero because we will not invent them — the UI collects them from the
 * baker instead.
 */
export const GENERIC_SURFACES: readonly SteelProfile[] = [
  {
    id: "standard-steel",
    name: "Other baking steel",
    widthInches: 0,
    depthInches: 0,
    thicknessInches: 0,
    weightPounds: 0,
    description: "Enter your own steel dimensions to get fit guidance.",
  },
  {
    id: "pizza-stone",
    name: "Pizza stone",
    widthInches: 0,
    depthInches: 0,
    thicknessInches: 0,
    weightPounds: 0,
    description: "Enter your own stone dimensions to get fit guidance.",
  },
];

export const STEEL_PROFILES: readonly SteelProfile[] = [
  BAKING_STEEL_PLUS,
  ...GENERIC_SURFACES,
];

/**
 * Nominal sheet pan starting points.
 *
 * Interior dimensions differ between manufacturers, and rim geometry varies
 * even within a single nominal size. We therefore seed the usable interior
 * with the nominal size and mark it unmeasured, so the interface can ask the
 * baker to measure the flat inside surface rather than quietly guessing.
 */
export const PAN_PROFILES: readonly PanProfile[] = [
  {
    id: "half-sheet-13x18",
    name: 'Half sheet pan (nominal 13" x 18")',
    shortName: "Half sheet",
    nominalLengthInches: 18,
    nominalWidthInches: 13,
    usableInteriorLengthInches: 18,
    usableInteriorWidthInches: 13,
    isInteriorMeasured: false,
    isRimmed: true,
  },
  {
    /**
     * A cookie sheet is the flat, rimless (or single-lip) tray most home
     * kitchens already own. Sizes vary more than sheet pans do, so this is a
     * common large size used as a starting point, not a standard.
     */
    id: "cookie-sheet-12x15",
    name: 'Cookie sheet (nominal 12" x 15")',
    shortName: "Cookie sheet",
    nominalLengthInches: 15,
    nominalWidthInches: 12,
    usableInteriorLengthInches: 15,
    usableInteriorWidthInches: 12,
    isInteriorMeasured: false,
    isRimmed: false,
  },
  {
    id: "quarter-sheet-10x15",
    name: 'Sheet pan (nominal 10" x 15")',
    shortName: "Small sheet",
    nominalLengthInches: 15,
    nominalWidthInches: 10,
    usableInteriorLengthInches: 15,
    usableInteriorWidthInches: 10,
    isInteriorMeasured: false,
    isRimmed: true,
  },
  {
    id: "rectangular-9x13",
    name: 'Rectangular pan (nominal 9" x 13")',
    shortName: '9" x 13"',
    nominalLengthInches: 13,
    nominalWidthInches: 9,
    usableInteriorLengthInches: 13,
    usableInteriorWidthInches: 9,
    isInteriorMeasured: false,
    isRimmed: true,
  },
  {
    id: "custom-pan",
    name: "Custom pan",
    shortName: "Custom",
    nominalLengthInches: 0,
    nominalWidthInches: 0,
    usableInteriorLengthInches: 0,
    usableInteriorWidthInches: 0,
    isInteriorMeasured: false,
    isRimmed: true,
  },
];

export const MEASURE_PAN_INTERIOR_NOTICE =
  "Measure the flat inside baking surface of your actual pan for the most accurate result.";

/** Shortest usable edge of a surface, which is what caps round pizza diameter. */
export function shortestSurfaceEdgeInches(profile: SteelProfile): number {
  return Math.min(profile.widthInches, profile.depthInches);
}
