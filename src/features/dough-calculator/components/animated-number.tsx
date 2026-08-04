"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A lightweight numeric readout. It is seeded with the first value, so it never counts up
 * from zero on load — it is correct on the very first paint and only animates
 * when something the baker did changes it.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  /** Turns the in-flight number into display text, units included. */
  format: (value: number) => string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      currentRef.current = value;
      return;
    }
    const start = currentRef.current;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 260, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + (value - start) * eased;
      currentRef.current = next;
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion, value]);

  if (prefersReducedMotion) {
    return <span className={cn("tabular", className)}>{format(value)}</span>;
  }

  return (
    <span className={cn("tabular", className)}>{format(displayValue)}</span>
  );
}
