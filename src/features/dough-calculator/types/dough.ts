/**
 * Core domain models for the dough calculator.
 *
 * Unit conventions used throughout the domain layer:
 * - Linear dimensions are inches.
 * - Weights are grams.
 * - Dough loading is grams per square inch.
 * - Baker's percentages are stored as decimals (0.65 means 65%).
 *
 * These types are framework independent. Nothing here may import React.
 */

export type PizzaShape = "round" | "rectangular";

export type PizzaStyle =
  | "new-york"
  | "neapolitan-inspired-home-oven"
  | "sicilian"
  | "grandma"
  | "custom";

export type BakingSurface =
  | "baking-steel-plus"
  | "standard-steel"
  | "pizza-stone"
  | "sheet-pan"
  | "custom";

export type DoughSizingMode = "dough-loading" | "manual-dough-weight";

export type FatType = "none" | "olive-oil" | "neutral-oil" | "tallow";

export type LeaveningMethod = "commercial-yeast" | "sourdough" | "hybrid";

export type CommercialYeastType = "instant-dry" | "active-dry" | "fresh";

/**
 * How the target dough weight is arrived at.
 *
 * Modelled as a discriminated union so a dough loading and a manual weight can
 * never both be active at once.
 */
export type DoughSizingSelection =
  | {
      readonly mode: "dough-loading";
      readonly doughLoadingGramsPerSquareInch: number;
    }
  | {
      readonly mode: "manual-dough-weight";
      readonly doughWeightPerUnitGrams: number;
    };

export type RoundSizingInput = {
  readonly shape: "round";
  readonly diameterInches: number;
  readonly quantity: number;
  readonly selection: DoughSizingSelection;
};

export type RectangularSizingInput = {
  readonly shape: "rectangular";
  /** Measured flat inside baking surface, never the nominal outer size. */
  readonly usableInteriorLengthInches: number;
  readonly usableInteriorWidthInches: number;
  readonly quantity: number;
  readonly selection: DoughSizingSelection;
};

export type SizingInput = RoundSizingInput | RectangularSizingInput;

export type SizingResult = {
  readonly shape: PizzaShape;
  /** Baking area of a single pizza or pan, in square inches. */
  readonly areaPerUnitSquareInches: number;
  readonly quantity: number;
  readonly doughWeightPerUnitGrams: number;
  readonly totalDoughWeightGrams: number;
  /** Grams per square inch actually in effect. */
  readonly effectiveDoughLoadingGramsPerSquareInch: number;
  /**
   * True when the loading above was back-calculated from a manually entered
   * dough weight rather than supplied directly by the user.
   */
  readonly isLoadingDerived: boolean;
};

/**
 * A sourdough starter, described relative to the formula rather than in grams
 * so it scales with batch size.
 */
export type StarterConfiguration = {
  /** Starter weight divided by total flour weight, as a decimal. */
  readonly percentageOfTotalFlour: number;
  /** Starter water divided by starter flour, as a decimal. */
  readonly hydration: number;
};

export type LeaveningInput =
  | {
      readonly method: "commercial-yeast";
      readonly yeastType: CommercialYeastType;
      readonly yeastPercentage: number;
    }
  | {
      readonly method: "sourdough";
      readonly starter: StarterConfiguration;
    }
  | {
      readonly method: "hybrid";
      readonly yeastType: CommercialYeastType;
      readonly yeastPercentage: number;
      readonly starter: StarterConfiguration;
    };

export type FlourBlendItem = {
  readonly id: string;
  readonly name: string;
  /** Share of the flour the baker weighs out, as a decimal. */
  readonly percentage: number;
};

export type FlourBlendResult = FlourBlendItem & {
  readonly grams: number;
};

export type CustomIngredientInput = {
  readonly id: string;
  readonly name: string;
  /** Baker's percentage relative to total flour, as a decimal. */
  readonly percentage: number;
};

export type DoughFormulaInput = {
  readonly sizing: SizingInput;
  readonly hydration: number;
  readonly salt: number;
  readonly fatType: FatType;
  readonly fat: number;
  readonly sugar: number;
  readonly malt: number;
  readonly leavening: LeaveningInput;
  readonly customIngredients: readonly CustomIngredientInput[];
  readonly flourBlend: readonly FlourBlendItem[];
};

export type IngredientKind =
  | "flour"
  | "water"
  | "salt"
  | "fat"
  | "sugar"
  | "malt"
  | "yeast"
  | "starter"
  | "custom";

export type IngredientResult = {
  readonly id: string;
  readonly label: string;
  readonly kind: IngredientKind;
  /** Relative to total flour, as a decimal. Zero for flour itself. */
  readonly bakersPercentage: number;
  readonly grams: number;
};

export type StarterResult = {
  readonly weightGrams: number;
  readonly flourGrams: number;
  readonly waterGrams: number;
  readonly hydration: number;
  /** Starter flour divided by total flour, as a decimal. */
  readonly prefermentedFlourPercentage: number;
};

/**
 * `error` blocks the calculation. `warning` flags an unusual but workable
 * value. `info` is a neutral observation that needs no action at all.
 */
export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  /** Dot path of the offending input, when one applies. */
  readonly field?: string;
};

export type DoughFormulaResult = {
  readonly sizing: SizingResult;
  readonly totalFlourGrams: number;
  /** Flour the baker weighs out, after starter flour is accounted for. */
  readonly remainingFlourGrams: number;
  readonly totalWaterGrams: number;
  /** Water the baker weighs out, after starter water is accounted for. */
  readonly remainingWaterGrams: number;
  readonly starter: StarterResult | null;
  /** Total formula water divided by total flour. */
  readonly trueFinalHydration: number;
  readonly ingredients: readonly IngredientResult[];
  readonly flourBlend: readonly FlourBlendResult[];
  readonly totalDoughWeightGrams: number;
  readonly warnings: readonly ValidationIssue[];
};

/**
 * Result of a calculation attempt. Errors are returned rather than thrown so
 * the UI can render them next to the offending field.
 */
export type DoughCalculation =
  | { readonly ok: true; readonly result: DoughFormulaResult }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };
