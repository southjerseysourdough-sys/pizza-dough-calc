"use client";

import { AlertTriangleIcon, CircleAlertIcon, InfoIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { ValidationIssue, ValidationSeverity } from "../types/dough";

/**
 * Errors, advisories and notes.
 *
 * Severity is carried by icon, heading word and surface — never colour alone —
 * so the distinction survives greyscale and any form of colour blindness.
 *
 * Red is reserved for input the engine actually rejected. An advisory about a
 * large pizza on a small steel is a warm amber note, because the calculation
 * is perfectly valid and nothing needs fixing.
 */
const PRESENTATION: Record<
  ValidationSeverity,
  {
    Icon: typeof InfoIcon;
    surface: string;
    iconTone: string;
    heading: string;
  }
> = {
  error: {
    Icon: CircleAlertIcon,
    surface:
      "bg-destructive/8 ring-1 ring-destructive/25 rounded-xl text-foreground",
    iconTone: "text-destructive",
    heading: "Check this value",
  },
  warning: {
    Icon: AlertTriangleIcon,
    surface: "surface-warning text-foreground",
    iconTone: "text-warning",
    heading: "Worth knowing",
  },
  info: {
    Icon: InfoIcon,
    surface: "surface-inset text-foreground",
    iconTone: "text-muted-foreground",
    heading: "Note",
  },
};

export function IssueList({
  issues,
  className,
}: {
  issues: readonly ValidationIssue[];
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      <AnimatePresence initial={false}>
        {issues.map((issue) => {
          const { Icon, surface, iconTone, heading } =
            PRESENTATION[issue.severity];

          return (
            <motion.li
              key={`${issue.code}-${issue.field ?? ""}`}
              // Under reduced motion entries simply appear and disappear.
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: -4, scale: 0.99 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -4, scale: 0.99 }
              }
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              className={cn("flex gap-3 px-3.5 py-3", surface)}
            >
              <Icon
                aria-hidden="true"
                className={cn("mt-0.5 size-4 shrink-0", iconTone)}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm leading-tight font-semibold">
                  {heading}
                </span>
                <span className="text-sm leading-snug text-foreground/85">
                  {issue.message}
                </span>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
