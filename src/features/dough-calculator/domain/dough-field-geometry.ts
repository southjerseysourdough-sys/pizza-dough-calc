import type { DoughFieldState } from "../components/dough-field";

export type FieldLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
};
export type DoughFieldGeometry = {
  shape: DoughFieldState["shape"];
  activePath: string;
  contourPaths: string[];
  guideLines: FieldLine[];
  dimensionLines: FieldLine[];
  primaryLabel: string;
  secondaryLabel: string | null;
  center: { x: number; y: number };
};

export type DoughFieldTransitionPlan = {
  retractMs: number;
  morphMs: number;
  labelDelayMs: number;
  settleMs: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function circlePath(cx: number, cy: number, radius: number): string {
  return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`;
}

function rectPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  inset = 0
): string {
  const x = cx - width / 2 + inset;
  const y = cy - height / 2 + inset;
  const w = Math.max(8, width - inset * 2);
  const h = Math.max(8, height - inset * 2);
  const r = Math.min(4, w / 6, h / 6);
  return `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}

export function createRoundFieldGeometry(
  state: DoughFieldState
): DoughFieldGeometry {
  const hydration = clamp(state.hydrationPercent, 40, 100);
  const loading = clamp(state.doughLoadingGramsPerSquareInch, 1, 8);
  const diameter = clamp(state.diameterInches, 6, 22);
  const center = {
    x: 240 + (hydration - 65) * 0.24,
    y: 157 + (loading - 3) * 1.6,
  };
  const radius = 76 + ((diameter - 6) / 16) * 26;
  const contourPaths = [1, 0.78, 0.56, 0.34].map((factor, index) =>
    circlePath(center.x + index * 1.4, center.y - index * 0.8, radius * factor)
  );
  const guideLines = Array.from({ length: 16 }, (_, index) => {
    const angle = (index * Math.PI * 2) / 16;
    const inner = radius + 8;
    const outer = radius + (index % 4 === 0 ? 18 : 13);
    return {
      x1: center.x + Math.cos(angle) * inner,
      y1: center.y + Math.sin(angle) * inner,
      x2: center.x + Math.cos(angle) * outer,
      y2: center.y + Math.sin(angle) * outer,
      active: index % 4 === 0,
    };
  });
  const y = center.y + radius + 28;
  return {
    shape: "round",
    activePath: contourPaths[0],
    contourPaths,
    guideLines,
    dimensionLines: [
      {
        x1: center.x - radius,
        y1: y,
        x2: center.x + radius,
        y2: y,
        active: true,
      },
      {
        x1: center.x - radius,
        y1: y - 6,
        x2: center.x - radius,
        y2: y + 6,
        active: true,
      },
      {
        x1: center.x + radius,
        y1: y - 6,
        x2: center.x + radius,
        y2: y + 6,
        active: true,
      },
    ],
    primaryLabel: `Ø ${state.diameterInches} IN`,
    secondaryLabel: null,
    center,
  };
}

export function createRectangularFieldGeometry(
  state: DoughFieldState
): DoughFieldGeometry {
  const hydration = clamp(state.hydrationPercent, 40, 100);
  const ratio = clamp(
    state.interiorWidthInches > 0
      ? state.interiorLengthInches / state.interiorWidthInches
      : 1.38,
    0.75,
    2.25
  );
  const width = 168 * Math.sqrt(ratio);
  const height = 168 / Math.sqrt(ratio);
  const center = { x: 240, y: 158 };
  const contourPaths = Array.from({ length: 4 }, (_, index) =>
    rectPath(
      center.x,
      center.y,
      width,
      height,
      index * (7 + (hydration - 50) * 0.025)
    )
  );
  const guideLines: FieldLine[] = [
    ...Array.from({ length: 9 }, (_, index) => {
      const x = center.x - width / 2 + (width / 8) * index;
      return {
        x1: x,
        y1: center.y - height / 2,
        x2: x,
        y2: center.y + height / 2,
      };
    }),
    ...Array.from({ length: 7 }, (_, index) => {
      const y = center.y - height / 2 + (height / 6) * index;
      return {
        x1: center.x - width / 2,
        y1: y,
        x2: center.x + width / 2,
        y2: y,
      };
    }),
  ];
  const bottom = center.y + height / 2 + 26;
  const right = center.x + width / 2 + 24;
  return {
    shape: "rectangular",
    activePath: contourPaths[0],
    contourPaths,
    guideLines,
    dimensionLines: [
      {
        x1: center.x - width / 2,
        y1: bottom,
        x2: center.x + width / 2,
        y2: bottom,
        active: true,
      },
      {
        x1: right,
        y1: center.y - height / 2,
        x2: right,
        y2: center.y + height / 2,
      },
    ],
    primaryLabel: `${state.interiorLengthInches} IN`,
    secondaryLabel: `${state.interiorWidthInches} IN`,
    center,
  };
}

export function createDoughFieldGeometry(
  state: DoughFieldState
): DoughFieldGeometry {
  return state.shape === "round"
    ? createRoundFieldGeometry(state)
    : createRectangularFieldGeometry(state);
}

export function createDoughFieldTransitionPlan(
  reducedMotion: boolean,
  modeChanged: boolean
): DoughFieldTransitionPlan {
  if (reducedMotion)
    return { retractMs: 0, morphMs: 0, labelDelayMs: 0, settleMs: 0 };
  return modeChanged
    ? { retractMs: 140, morphMs: 520, labelDelayMs: 180, settleMs: 220 }
    : { retractMs: 0, morphMs: 220, labelDelayMs: 40, settleMs: 140 };
}
