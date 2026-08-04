import { z } from "zod";

import { pizzaRecipeDocumentV2Schema } from "./recipe-document";
import type { FermentationStage, FermentationTimeline } from "./fermentation";
import type { PizzaRecipeDocument } from "./recipe-document";

export const BAKING_SESSION_STORAGE_KEY =
  "sjs:pizza-dough-calculator:baking-session:v1";
export const BAKING_SESSION_SCHEMA_VERSION = 1 as const;
export const BAKE_REPORT_SCHEMA_VERSION = 1 as const;

export const timerStateSchema = z.object({
  status: z.enum(["idle", "running", "paused", "complete"]),
  durationMs: z.number().finite().int().min(0),
  targetTimestamp: z.number().finite().int().optional(),
  pausedRemainingMs: z.number().finite().int().optional(),
  completedAt: z.iso.datetime().optional(),
});

export type TimerState = z.infer<typeof timerStateSchema>;

export const stageExecutionSchema = z.object({
  status: z.enum(["pending", "active", "completed", "skipped"]),
  actualStartedAt: z.iso.datetime().optional(),
  actualCompletedAt: z.iso.datetime().optional(),
  note: z.string().max(2000).optional(),
  observation: z
    .enum(["looks-ready", "needs-more-time", "not-sure"])
    .optional(),
});

export type StageExecution = z.infer<typeof stageExecutionSchema>;

export const scheduleShiftSchema = z.object({
  afterStageId: z.string().min(1),
  deltaMinutes: z.number().finite().int(),
  createdAt: z.iso.datetime(),
  reason: z.enum(["completion", "observation", "manual"]),
});

export const bakingSessionV1Schema = z.object({
  schemaVersion: z.literal(BAKING_SESSION_SCHEMA_VERSION),
  id: z.string().min(1),
  recipeDocument: pizzaRecipeDocumentV2Schema,
  currentStageId: z.string().min(1),
  stages: z.record(z.string(), stageExecutionSchema),
  shifts: z.array(scheduleShiftSchema),
  timer: timerStateSchema.optional(),
  timerStageId: z.string().optional(),
  generalNotes: z.string().max(5000),
  actualRoomTemperatureF: z.number().finite().optional(),
  actualRefrigeratorTemperatureF: z.number().finite().optional(),
  actualBakeDurationMinutes: z.number().finite().min(0).optional(),
  ovenSetting: z.string().max(200).optional(),
  resultRating: z.number().int().min(1).max(5).optional(),
  resultObservations: z.string().max(5000).optional(),
  status: z.enum(["active", "complete"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});

export type BakingSessionV1 = z.infer<typeof bakingSessionV1Schema>;
export type ScheduleShift = z.infer<typeof scheduleShiftSchema>;

export type BakingSessionResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

function identifier(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `bake-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function idleTimer(durationMinutes = 0): TimerState {
  return { status: "idle", durationMs: durationMinutes * 60_000 };
}

export function startTimer(timer: TimerState, now = Date.now()): TimerState {
  const remaining =
    timer.status === "paused"
      ? (timer.pausedRemainingMs ?? timer.durationMs)
      : timer.durationMs;
  return {
    status: "running",
    durationMs: timer.durationMs,
    targetTimestamp: now + remaining,
  };
}

export function pauseTimer(timer: TimerState, now = Date.now()): TimerState {
  if (timer.status !== "running" || timer.targetTimestamp === undefined)
    return timer;
  return {
    status: "paused",
    durationMs: timer.durationMs,
    pausedRemainingMs: timer.targetTimestamp - now,
  };
}

export function resetTimer(timer: TimerState): TimerState {
  return idleTimer(timer.durationMs / 60_000);
}

export function adjustTimer(
  timer: TimerState,
  deltaMinutes: number,
  now = Date.now()
): TimerState {
  const deltaMs = deltaMinutes * 60_000;
  const durationMs = Math.max(0, timer.durationMs + deltaMs);
  if (timer.status === "running")
    return {
      ...timer,
      durationMs,
      targetTimestamp: Math.max(now, (timer.targetTimestamp ?? now) + deltaMs),
    };
  if (timer.status === "paused")
    return {
      ...timer,
      durationMs,
      pausedRemainingMs: Math.max(
        0,
        (timer.pausedRemainingMs ?? timer.durationMs) + deltaMs
      ),
    };
  return { ...timer, durationMs };
}

export function completeTimer(timer: TimerState, now = new Date()): TimerState {
  return {
    status: "complete",
    durationMs: timer.durationMs,
    pausedRemainingMs: 0,
    completedAt: now.toISOString(),
  };
}

export function timerRemainingMs(timer: TimerState, now = Date.now()): number {
  if (timer.status === "running") return (timer.targetTimestamp ?? now) - now;
  if (timer.status === "paused")
    return timer.pausedRemainingMs ?? timer.durationMs;
  if (timer.status === "complete") return 0;
  return timer.durationMs;
}

export function formatTimerDisplay(milliseconds: number): string {
  const overtime = milliseconds < 0;
  const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const body = [hours, minutes, seconds]
    .map((value, index) =>
      index === 0 ? value.toString() : value.toString().padStart(2, "0")
    )
    .join(":");
  return overtime ? `+${body}` : body;
}

export function createBakingSession(
  recipeDocument: PizzaRecipeDocument,
  timeline: FermentationTimeline,
  now = new Date(),
  id = identifier()
): BakingSessionV1 {
  const stages: Record<string, StageExecution> = Object.fromEntries(
    timeline.stages.map((stage, index) => [
      stage.id,
      index === 0
        ? { status: "active" as const, actualStartedAt: now.toISOString() }
        : { status: "pending" as const },
    ])
  );
  return {
    schemaVersion: BAKING_SESSION_SCHEMA_VERSION,
    id,
    recipeDocument,
    currentStageId: timeline.stages[0].id,
    stages,
    shifts: [],
    generalNotes: "",
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function migrateBakingSession(
  input: unknown
): BakingSessionResult<BakingSessionV1> {
  const parsed = bakingSessionV1Schema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        message: "The saved Baking Day session is invalid or unsupported.",
      };
}

export function readBakingSession(
  storage?: Storage
): BakingSessionResult<BakingSessionV1 | null> {
  try {
    const target =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    if (!target)
      return { ok: false, message: "Local session storage is unavailable." };
    const raw = target.getItem(BAKING_SESSION_STORAGE_KEY);
    if (raw === null) return { ok: true, value: null };
    return migrateBakingSession(JSON.parse(raw) as unknown);
  } catch {
    return { ok: false, message: "The Baking Day session could not be read." };
  }
}

export function writeBakingSession(
  session: BakingSessionV1,
  storage?: Storage
): BakingSessionResult<BakingSessionV1> {
  const parsed = bakingSessionV1Schema.safeParse(session);
  if (!parsed.success)
    return { ok: false, message: "The Baking Day session is invalid." };
  try {
    const target =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    if (!target)
      return { ok: false, message: "Local session storage is unavailable." };
    target.setItem(BAKING_SESSION_STORAGE_KEY, JSON.stringify(parsed.data));
    return { ok: true, value: parsed.data };
  } catch {
    return { ok: false, message: "The Baking Day session could not be saved." };
  }
}

export function shiftedTimelineStages(
  timeline: FermentationTimeline,
  shifts: readonly ScheduleShift[]
): FermentationStage[] {
  return timeline.stages.map((stage) => {
    const stageIndex = timeline.stages.findIndex(
      (candidate) => candidate.id === stage.id
    );
    const shiftMinutes = shifts.reduce((total, shift) => {
      const afterIndex = timeline.stages.findIndex(
        (candidate) => candidate.id === shift.afterStageId
      );
      return stageIndex > afterIndex ? total + shift.deltaMinutes : total;
    }, 0);
    const delta = shiftMinutes * 60_000;
    return {
      ...stage,
      startTimestamp: stage.startTimestamp + delta,
      endTimestamp: stage.endTimestamp + delta,
    };
  });
}

export function finishStage(
  session: BakingSessionV1,
  timeline: FermentationTimeline,
  stageId: string,
  options: {
    now?: Date;
    skip?: boolean;
    shiftRemaining?: boolean;
  } = {}
): BakingSessionV1 {
  const now = options.now ?? new Date();
  const planned = shiftedTimelineStages(timeline, session.shifts).find(
    (stage) => stage.id === stageId
  );
  const index = timeline.stages.findIndex((stage) => stage.id === stageId);
  const next = timeline.stages[index + 1];
  const shifts = [...session.shifts];
  if (options.shiftRemaining && planned && next) {
    shifts.push({
      afterStageId: stageId,
      deltaMinutes: Math.round((now.getTime() - planned.endTimestamp) / 60_000),
      createdAt: now.toISOString(),
      reason: "completion",
    });
  }
  return {
    ...session,
    currentStageId: next?.id ?? stageId,
    stages: {
      ...session.stages,
      [stageId]: {
        ...session.stages[stageId],
        status: options.skip ? "skipped" : "completed",
        actualCompletedAt: now.toISOString(),
      },
      ...(next
        ? {
            [next.id]: {
              ...session.stages[next.id],
              status: "active" as const,
              actualStartedAt: now.toISOString(),
            },
          }
        : {}),
    },
    shifts,
    timer: undefined,
    timerStageId: undefined,
    updatedAt: now.toISOString(),
  };
}

export function returnStageToActive(
  session: BakingSessionV1,
  stageId: string,
  now = new Date()
): BakingSessionV1 {
  return {
    ...session,
    currentStageId: stageId,
    stages: {
      ...session.stages,
      [stageId]: {
        ...session.stages[stageId],
        status: "active",
        actualCompletedAt: undefined,
      },
    },
    updatedAt: now.toISOString(),
  };
}

export function extendStage(
  session: BakingSessionV1,
  stageId: string,
  minutes: number,
  shiftRemaining: boolean,
  now = new Date()
): BakingSessionV1 {
  return {
    ...session,
    stages: {
      ...session.stages,
      [stageId]: {
        ...session.stages[stageId],
        observation: "needs-more-time",
      },
    },
    shifts: shiftRemaining
      ? [
          ...session.shifts,
          {
            afterStageId: stageId,
            deltaMinutes: minutes,
            createdAt: now.toISOString(),
            reason: "observation",
          },
        ]
      : session.shifts,
    updatedAt: now.toISOString(),
  };
}

export function completeBakingSession(
  session: BakingSessionV1,
  now = new Date()
): BakingSessionV1 {
  return {
    ...session,
    status: "complete",
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
