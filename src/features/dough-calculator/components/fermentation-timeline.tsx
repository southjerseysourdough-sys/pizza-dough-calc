"use client";

import { CheckIcon, HammerIcon, HourglassIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatTimelineDuration,
  formatTimelineTimestamp,
  type FermentationStage,
} from "../domain/fermentation";

export function FermentationTimelineView({
  stages,
  currentStageId,
  completedStageIds = [],
  compact = false,
}: {
  stages: readonly FermentationStage[];
  currentStageId?: string;
  completedStageIds?: readonly string[];
  compact?: boolean;
}) {
  return (
    <ol
      className="relative grid gap-0"
      aria-label="Fermentation schedule in chronological order"
    >
      {stages.map((stage) => {
        const current = stage.id === currentStageId;
        const completed = completedStageIds.includes(stage.id);
        return (
          <li
            key={stage.id}
            className={cn(
              "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-3 pb-4 last:pb-0",
              compact && "pb-3"
            )}
            aria-current={current ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-1 grid size-4 place-items-center rounded-full border-[0.5px] border-graphite bg-carbon text-muted-foreground after:absolute after:top-4 after:h-[calc(100%+0.25rem)] after:w-px after:bg-graphite last:after:hidden",
                current && "border-acid-lime bg-acid-lime text-void",
                completed && "bg-graphite text-muted-foreground"
              )}
            >
              {completed ? (
                <CheckIcon className="size-2.5" />
              ) : stage.activeWork ? (
                <HammerIcon className="size-2.5" />
              ) : (
                <HourglassIcon className="size-2.5" />
              )}
            </span>
            <div className={cn("min-w-0", current && "text-foreground")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span
                  className={cn(
                    "text-sm text-secondary-foreground",
                    current && "font-medium text-foreground",
                    completed && "text-muted-foreground line-through"
                  )}
                >
                  {stage.label}
                </span>
                <span className="tabular font-mono text-[10px] text-muted-foreground">
                  {formatTimelineTimestamp(stage.startTimestamp)}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-2 font-mono text-[9px] tracking-[0.04em] text-muted-foreground uppercase">
                <span>{formatTimelineDuration(stage.durationMinutes)}</span>
                <span>{stage.activeWork ? "Active work" : "Rest / wait"}</span>
                {stage.temperatureF !== undefined ? (
                  <span>{stage.temperatureF}°F</span>
                ) : null}
              </div>
              {!compact && stage.advisory ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {stage.advisory}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
