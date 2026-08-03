"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

/**
 * A numeric readout that springs to its new value.
 *
 * Built on Motion rather than a registry component. The Vengeance UI
 * `animated-number` entry was reviewed and rejected: it declares
 * `framer-motion` as a direct dependency, duplicating the `motion` package
 * already installed, and it splits `value.toString()` into index-keyed digits,
 * which cannot carry a unit suffix or decimal formatting like "1.69 kg".
 * See docs/component-inventory.md.
 *
 * The spring is seeded with the first value, so the number never counts up
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

  // Seeded with the initial value: no count-up on first render.
  const target = useMotionValue(value);
  const spring = useSpring(target, {
    stiffness: 170,
    damping: 26,
    // Below this the spring settles instead of crawling the last fraction.
    restDelta: 0.5,
  });

  useEffect(() => {
    // `set` writes to a motion value; it is not React state, so this does not
    // trigger a render and does not run afoul of the set-state-in-effect rule.
    target.set(value);
  }, [target, value]);

  const text = useTransform(spring, (latest) => format(latest));

  if (prefersReducedMotion) {
    return <span className={cn("tabular", className)}>{format(value)}</span>;
  }

  return <motion.span className={cn("tabular", className)}>{text}</motion.span>;
}
