import type { CustomIngredientInput, FlourBlendItem } from "./dough";

export type CalculatorFormValues = {
  shape: "round" | "rectangular";
  diameterInches: number;
  usableInteriorLengthInches: number;
  usableInteriorWidthInches: number;
  quantity: number;
  sizingMode: "dough-loading" | "manual-dough-weight";
  doughLoadingGramsPerSquareInch: number;
  manualDoughWeightGrams: number;
  hydrationPercent: number;
  saltPercent: number;
  fatType: "none" | "olive-oil" | "neutral-oil" | "tallow";
  fatPercent: number;
  sugarPercent: number;
  maltPercent: number;
  leaveningMethod: "commercial-yeast" | "sourdough" | "hybrid";
  yeastType: "instant-dry" | "active-dry" | "fresh";
  yeastPercent: number;
  starterPercent: number;
  starterHydrationPercent: number;
  flourBlend: Array<
    Omit<FlourBlendItem, "percentage"> & { percentage: number }
  >;
  customIngredients: Array<
    Omit<CustomIngredientInput, "percentage"> & { percentage: number }
  >;
};
