import type {
  BakingSurface,
  DoughFormulaInput,
  PizzaStyle,
} from "../types/dough";
import { STANDARD_ROUND_DOUGH_LOADING } from "./sizes";

/**
 * Starting-point formulas.
 *
 * These are editable defaults drawn from common home-baking practice, not
 * optimal or authoritative values. Every subjective number below is shown with
 * the arithmetic that produced it so it can be argued with and changed.
 *
 * Dough loading is grams of dough per square inch of baking surface. It is the
 * cleanest way to keep a style consistent across sizes, because it scales with
 * area rather than with diameter.
 */

export type CalculatorPreset = {
  readonly id: string;
  readonly name: string;
  /** Short label for the style chips, where the full name will not fit. */
  readonly shortName: string;
  readonly style: PizzaStyle;
  readonly description: string;
  /** Subjective choices behind this preset, surfaced in the interface. */
  readonly assumptions: readonly string[];
  readonly surface: BakingSurface;
  readonly panProfileId?: string;
  readonly input: DoughFormulaInput;
};

export const NEW_YORK_ON_STEEL: CalculatorPreset = {
  id: "new-york-steel",
  shortName: "New York",
  name: "New York on Baking Steel Plus",
  style: "new-york",
  surface: "baking-steel-plus",
  description:
    "A moderately hydrated, lightly enriched dough for a thin, foldable slice.",
  assumptions: [
    "A 16 inch pie gets a 480 g dough ball — the standard size this calculator is built around.",
    "Every other diameter uses the same dough loading, so the crust stays the same thickness as the pie grows.",
    "A little oil and sugar aid browning at home-oven temperatures.",
    "Diastatic malt is optional; it is included at a low level for crust colour.",
  ],
  input: {
    sizing: {
      shape: "round",
      diameterInches: 16,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        // Derived from the 480 g / 16" anchor: about 2.39 g/in².
        doughLoadingGramsPerSquareInch: STANDARD_ROUND_DOUGH_LOADING,
      },
    },
    hydration: 0.63,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.02,
    sugar: 0.01,
    malt: 0.005,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      // A starting point for a same-day to overnight room temperature rise.
      // Fermentation time and temperature are not modelled in this release.
      yeastPercentage: 0.002,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const NEAPOLITAN_INSPIRED_HOME_OVEN: CalculatorPreset = {
  id: "neapolitan-inspired-home-oven",
  shortName: "Neapolitan",
  name: "Neapolitan inspired, home oven",
  style: "neapolitan-inspired-home-oven",
  surface: "baking-steel-plus",
  description:
    "A lean dough with no fat or sugar, sized for a smaller, puffier pie.",
  assumptions: [
    "2.30 g/in² gives about 260 g of dough for a 12 inch pie.",
    "No oil, sugar or malt, following lean Neapolitan practice.",
    "Named 'inspired' because a home oven cannot reach true Neapolitan bake temperatures.",
  ],
  input: {
    sizing: {
      shape: "round",
      diameterInches: 12,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        // 2.30 g/in² x (pi x 6²) in² = about 260 g for a 12 inch pie.
        doughLoadingGramsPerSquareInch: 2.3,
      },
    },
    hydration: 0.62,
    // Neapolitan practice runs saltier than most bread doughs.
    salt: 0.028,
    fatType: "none",
    fat: 0,
    sugar: 0,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      // Low, on the assumption of a long room temperature fermentation.
      yeastPercentage: 0.001,
    },
    customIngredients: [],
    flourBlend: [{ id: "00-flour", name: "00 flour", percentage: 1 }],
  },
};

export const SICILIAN_SHEET_PAN: CalculatorPreset = {
  id: "sicilian-sheet-pan",
  shortName: "Sicilian",
  name: "Sicilian in a half sheet pan",
  style: "sicilian",
  surface: "sheet-pan",
  panProfileId: "half-sheet-13x18",
  description:
    "A thick, open-crumbed pan pizza with a generous amount of olive oil.",
  assumptions: [
    "4.50 g/in² gives about 1053 g of dough across a nominal 13 x 18 inch pan.",
    "Higher hydration than a round pizza suits the long, undisturbed pan proof.",
    "Olive oil at 4% reflects the oiled pan and enriched crumb typical of the style.",
  ],
  input: {
    sizing: {
      shape: "rectangular",
      // Seeded from the nominal pan size. The interface asks the baker to
      // replace these with measured interior dimensions.
      usableInteriorLengthInches: 18,
      usableInteriorWidthInches: 13,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        // 4.50 g/in² x (18 x 13) in² = about 1053 g for a full pan.
        doughLoadingGramsPerSquareInch: 4.5,
      },
    },
    hydration: 0.7,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.04,
    sugar: 0.01,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.003,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const GRANDMA_SHEET_PAN: CalculatorPreset = {
  id: "grandma-sheet-pan",
  shortName: "Grandma",
  name: "Grandma in a half sheet pan",
  style: "grandma",
  surface: "sheet-pan",
  panProfileId: "half-sheet-13x18",
  description:
    "Thinner and denser than Sicilian, pressed straight out into an oiled pan.",
  assumptions: [
    "3.40 g/in² gives about 796 g of dough across a nominal 13 x 18 inch pan, noticeably thinner than the Sicilian preset.",
    "Lower hydration than Sicilian, since the dough is pressed rather than left to spread.",
  ],
  input: {
    sizing: {
      shape: "rectangular",
      usableInteriorLengthInches: 18,
      usableInteriorWidthInches: 13,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        // 3.40 g/in² x (18 x 13) in² = about 796 g for a full pan.
        doughLoadingGramsPerSquareInch: 3.4,
      },
    },
    hydration: 0.65,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.03,
    sugar: 0.005,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.0025,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const COOKIE_SHEET: CalculatorPreset = {
  id: "cookie-sheet",
  shortName: "Cookie sheet",
  name: "Cookie sheet pizza",
  style: "grandma",
  surface: "sheet-pan",
  panProfileId: "cookie-sheet-12x15",
  description:
    "A thin, crisp-bottomed pan pizza on the flat baking sheet you already own.",
  assumptions: [
    "3.00 g/in² gives about 540 g of dough across a nominal 12 x 15 inch cookie sheet.",
    "Thinner than the Grandma preset, because a rimless sheet cannot hold a tall dough.",
    "Cookie sheet sizes vary more than sheet pans do, so measure yours and enter it.",
  ],
  input: {
    sizing: {
      shape: "rectangular",
      usableInteriorLengthInches: 15,
      usableInteriorWidthInches: 12,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        // 3.00 g/in² x (15 x 12) in² = 540 g for a full sheet.
        doughLoadingGramsPerSquareInch: 3,
      },
    },
    hydration: 0.65,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.03,
    sugar: 0.005,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.0025,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const CUSTOM_ROUND: CalculatorPreset = {
  id: "custom-round",
  shortName: "Custom round",
  name: "Custom round pizza",
  style: "custom",
  surface: "custom",
  description: "A neutral round starting point with nothing style-specific.",
  assumptions: [
    "2.60 g/in² sits between the Neapolitan-inspired and New York presets.",
    "No sugar or malt, so the formula stays neutral until you change it.",
  ],
  input: {
    sizing: {
      shape: "round",
      diameterInches: 14,
      quantity: 2,
      selection: {
        mode: "dough-loading",
        // 2.60 g/in² x (pi x 7²) in² = about 400 g for a 14 inch pie.
        doughLoadingGramsPerSquareInch: 2.6,
      },
    },
    hydration: 0.65,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.02,
    sugar: 0,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.002,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const CUSTOM_RECTANGULAR: CalculatorPreset = {
  id: "custom-rectangular",
  shortName: "Custom pan",
  name: "Custom pan pizza",
  style: "custom",
  surface: "sheet-pan",
  panProfileId: "custom-pan",
  description: "A neutral rectangular starting point for any pan you measure.",
  assumptions: [
    "4.00 g/in² sits between the Grandma and Sicilian presets.",
    "Pan dimensions start from a nominal 13 x 18 and expect your measurements.",
  ],
  input: {
    sizing: {
      shape: "rectangular",
      usableInteriorLengthInches: 18,
      usableInteriorWidthInches: 13,
      quantity: 1,
      selection: {
        mode: "dough-loading",
        doughLoadingGramsPerSquareInch: 4,
      },
    },
    hydration: 0.68,
    salt: 0.02,
    fatType: "olive-oil",
    fat: 0.03,
    sugar: 0,
    malt: 0,
    leavening: {
      method: "commercial-yeast",
      yeastType: "instant-dry",
      yeastPercentage: 0.0025,
    },
    customIngredients: [],
    flourBlend: [{ id: "bread-flour", name: "Bread flour", percentage: 1 }],
  },
};

export const CALCULATOR_PRESETS: readonly CalculatorPreset[] = [
  NEW_YORK_ON_STEEL,
  NEAPOLITAN_INSPIRED_HOME_OVEN,
  SICILIAN_SHEET_PAN,
  GRANDMA_SHEET_PAN,
  COOKIE_SHEET,
  CUSTOM_ROUND,
  CUSTOM_RECTANGULAR,
];

export const DEFAULT_PRESET = NEW_YORK_ON_STEEL;

/**
 * Where each format starts.
 *
 * A round dough loading applied to a sheet pan is not a pan pizza, so
 * switching format has to land on a preset built for the new shape rather
 * than carrying the old thickness across.
 */
export const DEFAULT_PRESET_FOR_SHAPE = {
  round: NEW_YORK_ON_STEEL,
  rectangular: SICILIAN_SHEET_PAN,
} as const;

export function findPreset(id: string): CalculatorPreset | undefined {
  return CALCULATOR_PRESETS.find((preset) => preset.id === id);
}

/**
 * The presets offered for a given format.
 *
 * The style step only ever shows doughs that make sense for the shape already
 * chosen, so a baker making a round pizza is never asked to consider Sicilian.
 */
export function presetsForShape(
  shape: "round" | "rectangular"
): readonly CalculatorPreset[] {
  return CALCULATOR_PRESETS.filter(
    (preset) => preset.input.sizing.shape === shape
  );
}
