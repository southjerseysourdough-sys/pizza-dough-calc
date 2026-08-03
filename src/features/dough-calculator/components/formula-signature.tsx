"use client";

import { animate, createScope, stagger, svg, type Scope } from "animejs";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  polarArcPath,
  type FormulaSignatureData,
} from "../domain/formula-signature";

export function FormulaSignature({
  data,
  animateSignal = false,
  className,
}: {
  data: FormulaSignatureData;
  animateSignal?: boolean;
  className?: string;
}) {
  const rootRef = useRef<SVGSVGElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const signatureKey = data.marks.join("-");

  useEffect(() => {
    if (!rootRef.current) return;
    scopeRef.current = createScope({ root: rootRef });
    return () => {
      scopeRef.current?.revert();
      scopeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scope = scopeRef.current;
    const firstPath = rootRef.current?.querySelector<SVGPathElement>(
      "[data-signature-active]"
    );
    if (
      !scope ||
      !animateSignal ||
      prefersReducedMotion ||
      !firstPath ||
      typeof firstPath.getTotalLength !== "function"
    )
      return;
    scope.execute(() => {
      const drawables = svg.createDrawable("[data-signature-active]");
      animate(drawables, {
        draw: ["0 0", "0 1"],
        duration: 420,
        delay: stagger(28),
        ease: "inOut(3)",
      });
    });
  }, [animateSignal, prefersReducedMotion, signatureKey]);

  return (
    <svg
      ref={rootRef}
      role="img"
      aria-label={data.accessibleLabel}
      viewBox="0 0 112 112"
      className={cn("shrink-0", className)}
    >
      {data.shape === "round" ? (
        <circle
          cx="56"
          cy="56"
          r="52"
          className="fill-none stroke-graphite"
          strokeWidth="1"
        />
      ) : (
        <rect
          x="7"
          y="12"
          width="98"
          height="88"
          rx="3"
          className="fill-none stroke-graphite"
          strokeWidth="1"
        />
      )}
      {data.arcs.map((arc) => (
        <path
          key={arc.key}
          data-signature-active={arc.active ? "" : undefined}
          d={polarArcPath(arc.radius, arc.start, arc.sweep)}
          className={
            arc.active ? "fill-none stroke-acid-lime" : "fill-none stroke-smoke"
          }
          strokeWidth={arc.active ? 1.5 : 0.75}
          strokeLinecap="round"
        />
      ))}
      {data.marks.map((mark, index) => {
        const angle = ((mark + index * 13) / 100) * Math.PI * 2;
        const inner = 48;
        const outer = index % 3 === 0 ? 53 : 51;
        return (
          <line
            key={`${mark}-${index}`}
            x1={56 + Math.cos(angle) * inner}
            y1={56 + Math.sin(angle) * inner}
            x2={56 + Math.cos(angle) * outer}
            y2={56 + Math.sin(angle) * outer}
            className={index % 3 === 0 ? "stroke-acid-lime" : "stroke-smoke"}
            strokeWidth="0.8"
          />
        );
      })}
      <circle cx="56" cy="56" r="1.8" className="fill-acid-lime" />
    </svg>
  );
}
