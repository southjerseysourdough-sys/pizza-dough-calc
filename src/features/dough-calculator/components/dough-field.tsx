"use client";

import { animate, createScope, svg, type Scope } from "animejs";
import { useEffect, useMemo, useRef } from "react";

import { PerspectiveGrid } from "@/components/ui/perspective-grid";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import {
  createDoughFieldGeometry,
  createDoughFieldTransitionPlan,
  type DoughFieldGeometry,
} from "../domain/dough-field-geometry";
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

/** Stylized pizza preview. Anime.js owns SVG path morphing; no canvas or WebGL is involved. */
export function DoughField({
  state,
  className,
}: {
  state: DoughFieldState;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const previousGeometry = useRef<DoughFieldGeometry | null>(null);
  const animations = useRef<Array<ReturnType<typeof animate>>>([]);
  const prefersReducedMotion = useReducedMotion();
  const geometry = useMemo(() => createDoughFieldGeometry(state), [state]);
  const isRound = state.shape === "round";

  useEffect(() => {
    if (!rootRef.current) return;
    scopeRef.current = createScope({ root: rootRef });
    return () => {
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      scopeRef.current?.revert();
      scopeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const scope = scopeRef.current;
    if (!root || !scope) return;
    const active = root.querySelector<SVGPathElement>("[data-field-active]");
    const target = root.querySelector<SVGPathElement>("[data-field-target]");
    const crust = root.querySelector<SVGPathElement>("[data-pizza-crust]");
    const cheese = root.querySelector<SVGPathElement>("[data-pizza-cheese]");
    const cheeseTarget = root.querySelector<SVGPathElement>(
      "[data-pizza-cheese-target]"
    );
    const toppings = root.querySelectorAll<SVGElement>("[data-pizza-topping]");
    const contours = root.querySelectorAll<SVGPathElement>(
      "[data-field-contour]"
    );
    const labels = root.querySelectorAll<SVGElement>("[data-field-label]");
    const dimensions = root.querySelectorAll<SVGElement>(
      "[data-field-dimension]"
    );
    if (!active || !target || !crust || !cheese || !cheeseTarget) return;

    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    const previous = previousGeometry.current;
    const modeChanged = previous !== null && previous.shape !== geometry.shape;
    const plan = createDoughFieldTransitionPlan(
      prefersReducedMotion,
      modeChanged
    );
    target.setAttribute("d", geometry.activePath);
    cheeseTarget.setAttribute("d", geometry.contourPaths[1]);

    const supportsPathMeasurement = typeof active.getTotalLength === "function";

    if (prefersReducedMotion || previous === null || !supportsPathMeasurement) {
      active.setAttribute("d", geometry.activePath);
      crust.setAttribute("d", geometry.activePath);
      cheese.setAttribute("d", geometry.contourPaths[1]);
      contours.forEach((contour, index) =>
        contour.setAttribute(
          "d",
          geometry.contourPaths[index] ?? geometry.activePath
        )
      );
      labels.forEach((label) => label.setAttribute("opacity", "1"));
      dimensions.forEach((line) => line.setAttribute("opacity", "1"));
      previousGeometry.current = geometry;
      return;
    }

    active.setAttribute("d", previous.activePath);
    crust.setAttribute("d", previous.activePath);
    cheese.setAttribute("d", previous.contourPaths[1]);
    scope.execute(() => {
      if (modeChanged)
        animations.current.push(
          animate(contours, {
            opacity: [1, 0.08],
            duration: plan.retractMs,
            ease: "out(2)",
          })
        );
      animations.current.push(
        animate(active, {
          d: svg.morphTo(target, 0.45),
          strokeWidth: [2.2, 1.5],
          duration: plan.morphMs,
          ease: "inOut(3)",
        })
      );
      animations.current.push(
        animate(crust, {
          d: svg.morphTo(target, 0.45),
          duration: plan.morphMs,
          ease: "inOut(3)",
        })
      );
      animations.current.push(
        animate(cheese, {
          d: svg.morphTo(cheeseTarget, 0.45),
          duration: plan.morphMs,
          ease: "inOut(3)",
        })
      );
      if (modeChanged)
        animations.current.push(
          animate(toppings, {
            opacity: [0.25, 1],
            scale: [0.94, 1],
            duration: plan.settleMs,
            delay: plan.labelDelayMs,
            ease: "out(3)",
          })
        );
      animations.current.push(
        animate(dimensions, {
          opacity: [0.15, 1],
          duration: plan.settleMs,
          delay: plan.labelDelayMs,
          ease: "out(3)",
        })
      );
      animations.current.push(
        animate(labels, {
          opacity: [0, 1],
          translateY: [3, 0],
          duration: plan.settleMs,
          delay: plan.labelDelayMs,
          ease: "out(3)",
        })
      );
      animations.current.push(
        animate(contours, {
          opacity: [modeChanged ? 0.08 : 0.45, 0.82],
          duration: plan.settleMs,
          delay: modeChanged ? plan.morphMs - 80 : 20,
          ease: "out(2)",
        })
      );
    });
    previousGeometry.current = geometry;
  }, [geometry, prefersReducedMotion]);

  const sizeLabel = isRound
    ? `${state.diameterInches} inch diameter`
    : `${state.interiorLengthInches} by ${state.interiorWidthInches} inch interior`;

  return (
    <figure
      ref={rootRef}
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
          Pizza Preview / {isRound ? "Round" : "Pan"}
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
            <radialGradient id="pizza-crust" cx="42%" cy="34%" r="72%">
              <stop offset="0" stopColor="#f1c879" />
              <stop offset="0.58" stopColor="#d99a4d" />
              <stop offset="0.86" stopColor="#aa612f" />
              <stop offset="1" stopColor="#71401f" />
            </radialGradient>
            <radialGradient id="pizza-cheese" cx="42%" cy="38%" r="70%">
              <stop offset="0" stopColor="#f7e1a3" />
              <stop offset="0.55" stopColor="#efc66f" />
              <stop offset="1" stopColor="#d9903d" />
            </radialGradient>
            <radialGradient id="pepperoni" cx="35%" cy="28%" r="70%">
              <stop offset="0" stopColor="#d15b43" />
              <stop offset="0.7" stopColor="#a43630" />
              <stop offset="1" stopColor="#6f2525" />
            </radialGradient>
            <filter
              id="pizza-shadow"
              x="-25%"
              y="-25%"
              width="150%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="7"
                stdDeviation="7"
                floodColor="#000"
                floodOpacity="0.58"
              />
            </filter>
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
          <path data-field-target d={geometry.activePath} className="hidden" />
          <path
            data-pizza-cheese-target
            d={geometry.contourPaths[1]}
            className="hidden"
          />
          {geometry.contourPaths.slice(2).map((path, index) => (
            <path
              key={index}
              data-field-contour
              d={path}
              className="fill-none stroke-smoke/55"
              strokeWidth="0.8"
              strokeDasharray={`${6 + index * 2} ${6 + index}`}
            />
          ))}
          {geometry.guideLines.map((line, index) => (
            <line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={
                line.active ? "stroke-acid-lime" : "stroke-graphite/70"
              }
              strokeWidth={line.active ? 1.1 : 0.5}
            />
          ))}
          <path
            data-pizza-crust
            d={geometry.activePath}
            fill="url(#pizza-crust)"
            filter="url(#pizza-shadow)"
          />
          <path
            data-pizza-cheese
            d={geometry.contourPaths[1]}
            fill="url(#pizza-cheese)"
            stroke="#9d3a2b"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <g data-pizza-topping>
            <path
              d="M201 122c12-8 23-3 27 6-9 7-19 8-27-6Z"
              fill="#f8e8b9"
              opacity="0.7"
            />
            <path
              d="M270 177c13-7 24-1 26 9-10 6-20 5-26-9Z"
              fill="#fff0c7"
              opacity="0.62"
            />
            <path
              d="M218 198c9-8 20-7 25 1-6 9-16 11-25-1Z"
              fill="#f9e5ad"
              opacity="0.58"
            />
          </g>
          <g data-pizza-topping>
            {[
              [205, 139, 12],
              [257, 119, 11],
              [292, 154, 12],
              [253, 186, 11],
              [198, 180, 10],
              [234, 155, 11],
            ].map(([cx, cy, radius]) => (
              <g key={`${cx}-${cy}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="url(#pepperoni)"
                  stroke="#692323"
                  strokeWidth="1.5"
                />
                <circle
                  cx={cx - 3}
                  cy={cy - 3}
                  r="2"
                  fill="#ef8060"
                  opacity="0.7"
                />
              </g>
            ))}
          </g>
          <g data-pizza-topping fill="#617b36" stroke="#314522" strokeWidth="1">
            <ellipse
              cx="218"
              cy="108"
              rx="5"
              ry="11"
              transform="rotate(-38 218 108)"
            />
            <ellipse
              cx="278"
              cy="198"
              rx="5"
              ry="11"
              transform="rotate(42 278 198)"
            />
            <ellipse
              cx="184"
              cy="160"
              rx="4.5"
              ry="10"
              transform="rotate(22 184 160)"
            />
          </g>
          <g data-pizza-topping fill="#9e5e28" opacity="0.55">
            <circle cx="224" cy="126" r="3.5" />
            <circle cx="275" cy="142" r="4" />
            <circle cx="221" cy="184" r="3" />
            <circle cx="263" cy="166" r="2.5" />
            <circle cx="190" cy="148" r="2.5" />
          </g>
          <path
            data-field-active
            d={geometry.activePath}
            className="fill-none stroke-acid-lime/80"
            strokeWidth="1.2"
          />
          {geometry.dimensionLines.map((line, index) => (
            <line
              key={index}
              data-field-dimension
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={line.active ? "stroke-acid-lime" : "stroke-smoke"}
              strokeWidth="1"
            />
          ))}
          <text
            data-field-label
            x="240"
            y="286"
            textAnchor="middle"
            className="fill-soft-foreground font-mono text-[10px]"
          >
            {geometry.primaryLabel}
          </text>
          {geometry.secondaryLabel ? (
            <text
              data-field-label
              x="435"
              y="158"
              textAnchor="middle"
              transform="rotate(90 435 158)"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {geometry.secondaryLabel}
            </text>
          ) : null}
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
        Pizza preview technical visualization: {sizeLabel},{" "}
        {state.hydrationPercent}% hydration,{" "}
        {formatDoughLoading(state.doughLoadingGramsPerSquareInch)},{" "}
        {formatTotalWeight(state.totalDoughWeightGrams)} total for{" "}
        {state.quantity}. Illustrative, not a scientific simulation.
      </figcaption>
    </figure>
  );
}
