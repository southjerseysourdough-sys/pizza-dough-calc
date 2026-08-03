"use client";

import { motion, useReducedMotion } from "motion/react";

import { PerspectiveGrid } from "@/components/ui/perspective-grid";
import { cn } from "@/lib/utils";
import { formatDoughLoading, formatTotalWeight } from "../utils/format";

export type DoughFieldState = {
  shape: "round" | "rectangular";
  diameterInches: number;
  interiorLengthInches: number;
  interiorWidthInches: number;
  hydrationPercent: number;
  doughLoadingGramsPerSquareInch: number;
  totalDoughWeightGrams: number;
  quantity: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function MetaReadout({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="tabular truncate font-mono text-[10px] text-soft-foreground">
        {value}
      </span>
    </span>
  );
}

/**
 * An illustrative measurement view derived from calculator inputs.
 * It deliberately avoids literal pizza or dough imagery and makes no claim
 * to simulate material science.
 */
export function DoughField({
  state,
  className,
}: {
  state: DoughFieldState;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isRound = state.shape === "round";
  const hydration = clamp(state.hydrationPercent, 40, 100);
  const loading = clamp(state.doughLoadingGramsPerSquareInch, 1, 8);
  const diameter = clamp(state.diameterInches, 6, 22);
  const centerX = 240 + (hydration - 65) * 0.24;
  const centerY = 157 + (loading - 3) * 1.6;
  const roundRadius = 76 + ((diameter - 6) / 16) * 26;
  const panRatio = clamp(
    state.interiorWidthInches > 0
      ? state.interiorLengthInches / state.interiorWidthInches
      : 1.38,
    0.75,
    2.25
  );
  const panWidth = 168 * Math.sqrt(panRatio);
  const panHeight = 168 / Math.sqrt(panRatio);
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  const sizeLabel = isRound
    ? `${state.diameterInches} inch diameter`
    : `${state.interiorLengthInches} by ${state.interiorWidthInches} inch interior`;

  return (
    <figure
      aria-labelledby="dough-field-caption"
      data-dough-field={isRound ? "round" : "rectangular"}
      data-diameter={state.diameterInches}
      data-length={state.interiorLengthInches}
      data-width={state.interiorWidthInches}
      data-hydration={state.hydrationPercent}
      data-loading={state.doughLoadingGramsPerSquareInch}
      data-total={state.totalDoughWeightGrams}
      data-quantity={state.quantity}
      className={cn(
        "relative isolate flex min-h-52 w-full min-w-0 flex-col overflow-hidden rounded-xl border-[0.5px] border-graphite bg-stage sm:min-h-72",
        className
      )}
    >
      <PerspectiveGrid className="absolute inset-0 -z-10 opacity-60" />

      <div className="flex items-center justify-between border-b-[0.5px] border-graphite px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-secondary-foreground uppercase">
          <span className="size-1.5 rounded-full bg-acid-lime" />
          Dough Field / {isRound ? "Radial" : "Planar"}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          ILLUSTRATIVE
        </span>
      </div>

      <div className="relative min-h-40 flex-1 sm:min-h-56">
        <svg
          aria-hidden="true"
          viewBox="0 0 480 320"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern
              id="fine-grid"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 16 0 L 0 0 0 16"
                className="fill-none stroke-graphite/35"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          <rect
            x="24"
            y="18"
            width="432"
            height="270"
            rx="2"
            fill="url(#fine-grid)"
            opacity="0.45"
          />
          <path
            d="M36 44h24M36 44v24M444 44h-24M444 44v24M36 274h24M36 274v-24M444 274h-24M444 274v-24"
            className="fill-none stroke-smoke"
            strokeWidth="1"
          />

          <motion.g
            animate={{ scale: 1 + (hydration - 65) / 1800 }}
            transition={transition}
            style={{
              display: isRound ? "block" : "none",
              transformOrigin: "240px 158px",
            }}
          >
            {[1, 0.78, 0.56, 0.34].map((factor, index) => (
              <circle
                key={factor}
                cx={centerX + index * 1.4}
                cy={centerY - index * 0.8}
                r={roundRadius * factor}
                className={
                  index === 0
                    ? "fill-none stroke-acid-lime"
                    : "fill-none stroke-smoke/85"
                }
                strokeWidth={index === 0 ? 1.5 : 0.8}
                strokeDasharray={
                  index === 0 ? "none" : `${4 + index * 2} ${5 + index}`
                }
              />
            ))}
            {Array.from({ length: 16 }, (_, index) => {
              const angle = (index * Math.PI * 2) / 16;
              const inner = roundRadius + 8;
              const outer = roundRadius + (index % 4 === 0 ? 18 : 13);
              return (
                <line
                  key={index}
                  x1={centerX + Math.cos(angle) * inner}
                  y1={centerY + Math.sin(angle) * inner}
                  x2={centerX + Math.cos(angle) * outer}
                  y2={centerY + Math.sin(angle) * outer}
                  className={
                    index % 4 === 0 ? "stroke-acid-lime" : "stroke-smoke"
                  }
                  strokeWidth={index % 4 === 0 ? 1.2 : 0.7}
                />
              );
            })}
            {Array.from({ length: 8 }, (_, index) => {
              const angle = (index * Math.PI) / 8;
              return (
                <line
                  key={index}
                  x1={centerX - Math.cos(angle) * roundRadius}
                  y1={centerY - Math.sin(angle) * roundRadius}
                  x2={centerX + Math.cos(angle) * roundRadius}
                  y2={centerY + Math.sin(angle) * roundRadius}
                  className="stroke-graphite/70"
                  strokeWidth="0.5"
                  strokeDasharray="2 5"
                />
              );
            })}
            <circle
              cx={centerX}
              cy={centerY}
              r="3"
              className="fill-acid-lime"
            />
            <line
              x1={centerX - roundRadius}
              y1={centerY + roundRadius + 28}
              x2={centerX + roundRadius}
              y2={centerY + roundRadius + 28}
              className="stroke-acid-lime"
              strokeWidth="1"
            />
            <line
              x1={centerX - roundRadius}
              y1={centerY + roundRadius + 22}
              x2={centerX - roundRadius}
              y2={centerY + roundRadius + 34}
              className="stroke-acid-lime"
              strokeWidth="1"
            />
            <line
              x1={centerX + roundRadius}
              y1={centerY + roundRadius + 22}
              x2={centerX + roundRadius}
              y2={centerY + roundRadius + 34}
              className="stroke-acid-lime"
              strokeWidth="1"
            />
            <text
              x={centerX}
              y={centerY + roundRadius + 49}
              textAnchor="middle"
              className="fill-soft-foreground font-mono text-[10px]"
            >
              Ø {state.diameterInches} IN
            </text>
          </motion.g>

          <motion.g
            animate={{ scale: 1 + (loading - 3) / 220 }}
            transition={transition}
            style={{
              display: isRound ? "none" : "block",
              transformOrigin: "240px 158px",
            }}
          >
            {Array.from({ length: 4 }, (_, index) => {
              const inset = index * (7 + (hydration - 50) * 0.025);
              return (
                <rect
                  key={index}
                  x={240 - panWidth / 2 + inset}
                  y={158 - panHeight / 2 + inset}
                  width={Math.max(panWidth - inset * 2, 8)}
                  height={Math.max(panHeight - inset * 2, 8)}
                  rx="2"
                  className={
                    index === 0
                      ? "fill-none stroke-acid-lime"
                      : "fill-none stroke-smoke/85"
                  }
                  strokeWidth={index === 0 ? 1.5 : 0.8}
                  strokeDasharray={
                    index === 0 ? "none" : `${5 + index} ${4 + index}`
                  }
                />
              );
            })}
            {Array.from({ length: 9 }, (_, index) => {
              const x = 240 - panWidth / 2 + (panWidth / 8) * index;
              return (
                <line
                  key={index}
                  x1={x}
                  y1={158 - panHeight / 2}
                  x2={x}
                  y2={158 + panHeight / 2}
                  className="stroke-graphite/70"
                  strokeWidth="0.5"
                />
              );
            })}
            {Array.from({ length: 7 }, (_, index) => {
              const y = 158 - panHeight / 2 + (panHeight / 6) * index;
              return (
                <line
                  key={index}
                  x1={240 - panWidth / 2}
                  y1={y}
                  x2={240 + panWidth / 2}
                  y2={y}
                  className="stroke-graphite/70"
                  strokeWidth="0.5"
                />
              );
            })}
            <line
              x1={240 - panWidth / 2}
              y1={158 + panHeight / 2 + 26}
              x2={240 + panWidth / 2}
              y2={158 + panHeight / 2 + 26}
              className="stroke-acid-lime"
              strokeWidth="1"
            />
            <text
              x="240"
              y={158 + panHeight / 2 + 43}
              textAnchor="middle"
              className="fill-soft-foreground font-mono text-[10px]"
            >
              {state.interiorLengthInches} IN
            </text>
            <line
              x1={240 + panWidth / 2 + 24}
              y1={158 - panHeight / 2}
              x2={240 + panWidth / 2 + 24}
              y2={158 + panHeight / 2}
              className="stroke-smoke"
              strokeWidth="1"
            />
            <text
              x={240 + panWidth / 2 + 39}
              y="158"
              textAnchor="middle"
              transform={`rotate(90 ${240 + panWidth / 2 + 39} 158)`}
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {state.interiorWidthInches} IN
            </text>
          </motion.g>
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-3 border-t-[0.5px] border-graphite px-3 py-2.5">
        <MetaReadout label="Hydration" value={`${state.hydrationPercent}%`} />
        <MetaReadout
          label="Loading"
          value={formatDoughLoading(state.doughLoadingGramsPerSquareInch)}
        />
        <MetaReadout
          label="Total"
          value={formatTotalWeight(state.totalDoughWeightGrams)}
        />
        <MetaReadout label="Count" value={`× ${state.quantity}`} />
      </div>

      <figcaption id="dough-field-caption" className="sr-only">
        Dough Field technical visualization: {sizeLabel},{" "}
        {state.hydrationPercent}% hydration,{" "}
        {formatDoughLoading(state.doughLoadingGramsPerSquareInch)},{" "}
        {formatTotalWeight(state.totalDoughWeightGrams)} total for{" "}
        {state.quantity}.
      </figcaption>
    </figure>
  );
}
