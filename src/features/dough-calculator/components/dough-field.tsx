"use client";

import { useEffect, useRef, useState } from "react";

import { PerspectiveGrid } from "@/components/ui/perspective-grid";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import {
  PIZZA_FRAME_COLUMNS,
  PIZZA_FRAME_COUNT,
  PIZZA_FRAME_ROWS,
  interpolatePizzaFrame,
  pizzaFramePosition,
} from "../domain/pizza-frame-sequence";
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

const SPRITE_URL = "/media/pizza-shape-frames.webp";

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

function applyFrame(element: HTMLDivElement, frame: number): number {
  const position = pizzaFramePosition(frame);
  element.style.backgroundPosition = `${position.xPercent}% ${position.yPercent}%`;
  element.dataset.pizzaFrame = String(position.frame);
  return position.frame;
}

/**
 * A deterministic, reversible frame sequence made from the baker's pizza.
 * One sprite avoids autoplay restrictions, canvas/WebGL, and dozens of image
 * requests while still allowing an interrupted transition to reverse cleanly.
 */
export function DoughField({
  state,
  className,
}: {
  state: DoughFieldState;
  className?: string;
}) {
  const visualRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(state.shape === "round" ? 0 : PIZZA_FRAME_COUNT - 1);
  const animationRef = useRef<number | null>(null);
  const [initialPosition] = useState(() =>
    pizzaFramePosition(state.shape === "round" ? 0 : PIZZA_FRAME_COUNT - 1)
  );
  const prefersReducedMotion = useReducedMotion();
  const isRound = state.shape === "round";

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    if (animationRef.current !== null)
      cancelAnimationFrame(animationRef.current);

    const startFrame = frameRef.current;
    const targetFrame = isRound ? 0 : PIZZA_FRAME_COUNT - 1;
    if (prefersReducedMotion || startFrame === targetFrame) {
      frameRef.current = applyFrame(visual, targetFrame);
      return;
    }

    const distance = Math.abs(targetFrame - startFrame);
    const duration = 220 + 980 * (distance / (PIZZA_FRAME_COUNT - 1));
    let startedAt: number | null = null;
    const tick = (timestamp: number) => {
      startedAt ??= timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      frameRef.current = applyFrame(
        visual,
        interpolatePizzaFrame(startFrame, targetFrame, progress)
      );
      if (progress < 1) animationRef.current = requestAnimationFrame(tick);
      else animationRef.current = null;
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null)
        cancelAnimationFrame(animationRef.current);
    };
  }, [isRound, prefersReducedMotion]);

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
      <div className="flex items-center justify-between border-b-[0.5px] border-graphite px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-secondary-foreground uppercase">
          <span className="size-1.5 rounded-full bg-acid-lime" />
          Pizza Preview / {isRound ? "Round" : "Pan"}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          REFERENCE VISUAL
        </span>
      </div>
      <div className="relative min-h-40 flex-1 overflow-hidden sm:min-h-56">
        <div className="absolute inset-0 grid place-items-center overflow-hidden">
          <div
            ref={visualRef}
            aria-hidden="true"
            data-pizza-sequence
            data-pizza-frame={initialPosition.frame}
            className="aspect-video w-[112%] shrink-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${SPRITE_URL})`,
              backgroundPosition: `${initialPosition.xPercent}% ${initialPosition.yPercent}%`,
              backgroundSize: `${PIZZA_FRAME_COLUMNS * 100}% ${PIZZA_FRAME_ROWS * 100}%`,
            }}
          />
        </div>
        <PerspectiveGrid className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,var(--stage)_100%)] opacity-55" />
        <svg
          aria-hidden="true"
          viewBox="0 0 480 320"
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M36 44h24M36 44v24M444 44h-24M444 44v24M36 274h24M36 274v-24M444 274h-24M444 274v-24"
            className="fill-none stroke-smoke"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x="240"
            y="289"
            textAnchor="middle"
            className="fill-soft-foreground font-mono text-[10px]"
          >
            {isRound
              ? `Ø ${state.diameterInches} IN`
              : `${state.interiorLengthInches} × ${state.interiorWidthInches} IN`}
          </text>
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
        Pizza preview made from a South Jersey Sourdough reference bake:{" "}
        {sizeLabel}, {state.hydrationPercent}% hydration,{" "}
        {formatDoughLoading(state.doughLoadingGramsPerSquareInch)},{" "}
        {formatTotalWeight(state.totalDoughWeightGrams)} total for{" "}
        {state.quantity}. The image is illustrative; the displayed measurements
        come from the calculator.
      </figcaption>
    </figure>
  );
}
