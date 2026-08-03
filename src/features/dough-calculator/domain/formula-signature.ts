import type { DoughFormulaInput } from "../types/dough";

export type FormulaSignatureArc = {
  key: string;
  radius: number;
  start: number;
  sweep: number;
  active: boolean;
};

export type FormulaSignatureData = {
  shape: "round" | "rectangular";
  arcs: FormulaSignatureArc[];
  marks: number[];
  accessibleLabel: string;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalize(value: number, max: number): number {
  return clamp01(value / max);
}

export function createFormulaSignatureData(
  input: DoughFormulaInput
): FormulaSignatureData {
  const starter =
    input.leavening.method === "commercial-yeast"
      ? 0
      : input.leavening.starter.percentageOfTotalFlour;
  const yeast =
    input.leavening.method === "sourdough"
      ? 0
      : input.leavening.yeastPercentage;
  const loading =
    input.sizing.selection.mode === "dough-loading"
      ? input.sizing.selection.doughLoadingGramsPerSquareInch
      : input.sizing.selection.doughWeightPerUnitGrams / 200;
  const values = [
    normalize(input.hydration - 0.4, 0.6),
    normalize(input.salt, 0.05),
    normalize(input.fat, 0.15),
    normalize(input.sugar, 0.1),
    normalize(input.malt, 0.05),
    normalize(starter, 0.6),
    normalize(yeast, 0.02),
    normalize(loading - 1, 7),
    input.sizing.shape === "round" ? 0.28 : 0.78,
    input.leavening.method === "commercial-yeast"
      ? 0.24
      : input.leavening.method === "sourdough"
        ? 0.62
        : 0.9,
  ];

  return {
    shape: input.sizing.shape,
    arcs: values.map((value, index) => ({
      key: `signal-${index + 1}`,
      radius: 12 + index * 4.2,
      start: -90 + index * 17,
      sweep: 38 + value * 250,
      active: index === 0 || index === 7 || index === 9,
    })),
    marks: values.map((value, index) =>
      Math.round((value * 73 + index * 19) % 100)
    ),
    accessibleLabel: `Formula signature for ${Math.round(input.hydration * 100)} percent hydration ${input.sizing.shape === "round" ? "round pizza" : "pan pizza"}`,
  };
}

export function polarArcPath(
  radius: number,
  startDegrees: number,
  sweepDegrees: number,
  center = 56
): string {
  const endDegrees = startDegrees + sweepDegrees;
  const point = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };
  const start = point(startDegrees);
  const end = point(endDegrees);
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${sweepDegrees > 180 ? 1 : 0} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}
