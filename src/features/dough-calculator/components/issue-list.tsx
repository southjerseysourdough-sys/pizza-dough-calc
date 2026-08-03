"use client";

import { AlertTriangleIcon, CircleAlertIcon, InfoIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import type { ValidationIssue, ValidationSeverity } from "../types/dough";

/**
 * Each severity gets its own icon and text prefix as well as its own colour,
 * so the three are still distinguishable in greyscale or with any form of
 * colour blindness.
 */
const PRESENTATION: Record<
  ValidationSeverity,
  { Icon: typeof InfoIcon; tone: string; iconTone: string; prefix: string }
> = {
  error: {
    Icon: CircleAlertIcon,
    tone: "bg-destructive/8 text-foreground ring-destructive/25",
    iconTone: "text-destructive",
    prefix: "Error: ",
  },
  warning: {
    Icon: AlertTriangleIcon,
    tone: "bg-warning-surface/60 text-foreground ring-warning/25",
    iconTone: "text-warning",
    prefix: "Heads up: ",
  },
  info: {
    Icon: InfoIcon,
    tone: "bg-muted/60 text-foreground ring-border",
    iconTone: "text-muted-foreground",
    prefix: "Note: ",
  },
};

/**
 * Errors and advisory warnings.
 *
 * Severity is never carried by colour alone: each entry pairs a distinct icon
 * with a text prefix naming the severity, so the distinction survives
 * greyscale, low vision and colour blindness.
 *
 * Entries animate in and out as the recipe changes, which is the one place in
 * the calculator where motion earns its keep — it shows that something new
 * appeared rather than having always been there. `AnimatePresence` is given
 * `initial={false}` so anything present on first paint renders immediately at
 * full opacity; only later changes animate. Nothing here can hide
 * server-rendered content.
 */
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
          const { Icon, tone, iconTone, prefix } = PRESENTATION[issue.severity];

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
              className={cn(
                "flex gap-2.5 rounded-lg px-3 py-2 text-sm ring-1",
                tone
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn("mt-0.5 size-4 shrink-0", iconTone)}
              />
              <span>
                <span className="font-medium">{prefix}</span>
                {issue.message}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
