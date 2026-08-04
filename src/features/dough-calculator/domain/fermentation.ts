import { z } from "zod";

import type { RecipeContext } from "./recipe-document";
import type { DoughFormulaInput } from "../types/dough";

export const scheduleDirectionSchema = z.enum([
  "forward-from-mix",
  "backward-from-bake",
]);

export const fermentationStageTypeSchema = z.enum([
  "ingredient-prep",
  "mix",
  "rest",
  "folds",
  "room-bulk",
  "divide",
  "ball",
  "cold-ferment",
  "remove-from-cold",
  "warm-up",
  "pan",
  "final-proof",
  "shape",
  "top",
  "preheat",
  "bake",
  "custom",
]);

export const fermentationTemplateIdSchema = z.enum([
  "new-york-cold",
  "new-york-same-day",
  "neapolitan-home",
  "sicilian-sheet-pan",
  "grandma",
  "sourdough-round",
  "sourdough-sheet-pan",
  "hybrid-cold",
  "custom",
]);

const durationMinutesSchema = z
  .number()
  .finite()
  .int()
  .min(0)
  .max(60 * 24 * 30);

export const customFermentationStageSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(80),
  durationMinutes: durationMinutesSchema,
  activeWork: z.boolean().default(false),
  position: z.enum(["after-mix", "before-cold", "before-bake"]),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Durable planner source. `anchorLocalDateTime` is a local wall-clock value in
 * `YYYY-MM-DDTHH:mm` form. It is interpreted in the viewing browser's local
 * timezone; `timezone` records where that intent was created and lets the UI
 * warn before the baker chooses whether to rebase the reference. No Date
 * objects or calculated stage timestamps are stored.
 */
export const fermentationPlanInputSchema = z
  .object({
    enabled: z.boolean(),
    templateId: fermentationTemplateIdSchema,
    direction: scheduleDirectionSchema,
    anchorLocalDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    timezone: z.string().trim().min(1).max(100),
    ingredientPrepMinutes: durationMinutesSchema,
    mixMinutes: durationMinutesSchema,
    initialRestMinutes: durationMinutesSchema,
    foldCount: z.number().finite().int().min(0).max(12),
    foldIntervalMinutes: durationMinutesSchema,
    roomBulkMinutes: durationMinutesSchema,
    coldFermentMinutes: durationMinutesSchema,
    warmUpMinutes: durationMinutesSchema,
    finalProofMinutes: durationMinutesSchema,
    preheatMinutes: durationMinutesSchema,
    divideBallMinutes: durationMinutesSchema,
    panMinutes: durationMinutesSchema,
    shapeTopMinutes: durationMinutesSchema,
    bakeMinutes: durationMinutesSchema,
    includeLevainPrep: z.boolean(),
    levainPrepMinutes: durationMinutesSchema,
    roomTemperatureF: z.number().finite().min(35).max(120).optional(),
    refrigeratorTemperatureF: z.number().finite().min(20).max(70).optional(),
    intendedDoughTemperatureF: z.number().finite().min(35).max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    customStages: z.array(customFermentationStageSchema).max(20),
  })
  .superRefine((plan, context) => {
    const identifiers = new Set<string>();
    plan.customStages.forEach((stage, index) => {
      if (identifiers.has(stage.id)) {
        context.addIssue({
          code: "custom",
          path: ["customStages", index, "id"],
          message: "Custom stage identifiers must be unique.",
        });
      }
      identifiers.add(stage.id);
    });
    if (plan.foldCount > 0 && plan.foldIntervalMinutes === 0) {
      context.addIssue({
        code: "custom",
        path: ["foldIntervalMinutes"],
        message: "A fold interval is required when folds are planned.",
      });
    }
  });

export type ScheduleDirection = z.infer<typeof scheduleDirectionSchema>;
export type FermentationStageType = z.infer<typeof fermentationStageTypeSchema>;
export type FermentationTemplateId = z.infer<
  typeof fermentationTemplateIdSchema
>;
export type CustomFermentationStage = z.infer<
  typeof customFermentationStageSchema
>;
export type FermentationPlanInput = z.infer<typeof fermentationPlanInputSchema>;

export type FermentationStage = {
  id: string;
  type: FermentationStageType;
  label: string;
  startTimestamp: number;
  endTimestamp: number;
  durationMinutes: number;
  activeWork: boolean;
  temperatureF?: number;
  instructionKey?: string;
  advisory?: string;
};

export type FermentationAdvisory = {
  code: string;
  message: string;
};

export type FermentationTimeline = {
  stages: FermentationStage[];
  mixTimestamp: number;
  bakeTimestamp: number;
  totalDurationMinutes: number;
  advisories: FermentationAdvisory[];
};

export type FermentationTimelineResult =
  { ok: true; value: FermentationTimeline } | { ok: false; errors: string[] };

type StageSource = Omit<FermentationStage, "startTimestamp" | "endTimestamp">;

export const FERMENTATION_TEMPLATES: readonly {
  id: FermentationTemplateId;
  label: string;
}[] = [
  { id: "new-york-cold", label: "New York cold ferment" },
  { id: "new-york-same-day", label: "Same-day New York" },
  { id: "neapolitan-home", label: "Neapolitan-inspired home oven" },
  { id: "sicilian-sheet-pan", label: "Sicilian sheet pan" },
  { id: "grandma", label: "Grandma pizza" },
  { id: "sourdough-round", label: "Sourdough round pizza" },
  { id: "sourdough-sheet-pan", label: "Sourdough sheet-pan pizza" },
  { id: "hybrid-cold", label: "Hybrid cold ferment" },
  { id: "custom", label: "Custom schedule" },
];

const active = (
  id: string,
  type: FermentationStageType,
  label: string,
  durationMinutes: number,
  extra: Partial<StageSource> = {}
): StageSource => ({
  id,
  type,
  label,
  durationMinutes,
  activeWork: true,
  instructionKey: type,
  ...extra,
});

const waiting = (
  id: string,
  type: FermentationStageType,
  label: string,
  durationMinutes: number,
  extra: Partial<StageSource> = {}
): StageSource => ({
  id,
  type,
  label,
  durationMinutes,
  activeWork: false,
  instructionKey: type,
  ...extra,
});

export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
  } catch {
    return "Local timezone";
  }
}

export function toLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseLocalAnchor(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  );
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute)
  )
    return null;
  return date.getTime();
}

function templateFor(
  input: DoughFormulaInput,
  context: RecipeContext
): FermentationTemplateId {
  const sheetPan = input.sizing.shape === "rectangular";
  const method = input.leavening.method;
  if (method === "hybrid") return "hybrid-cold";
  if (method === "sourdough")
    return sheetPan ? "sourdough-sheet-pan" : "sourdough-round";
  if (context.presetId.includes("sicilian")) return "sicilian-sheet-pan";
  if (context.presetId.includes("grandma")) return "grandma";
  if (context.presetId.includes("neapolitan")) return "neapolitan-home";
  return "new-york-cold";
}

export function createDefaultFermentationPlan(
  input: DoughFormulaInput,
  context: RecipeContext,
  now = new Date()
): FermentationPlanInput {
  const templateId = templateFor(input, context);
  const sheetPan = input.sizing.shape === "rectangular";
  const sameDay = templateId === "neapolitan-home";
  const sourdough = input.leavening.method === "sourdough";
  const bake = new Date(now);
  bake.setDate(bake.getDate() + (sameDay ? 1 : 3));
  bake.setHours(18, 0, 0, 0);
  return {
    enabled: true,
    templateId,
    direction: "backward-from-bake",
    anchorLocalDateTime: toLocalDateTimeInput(bake),
    timezone: getCurrentTimezone(),
    ingredientPrepMinutes: 15,
    mixMinutes: 20,
    initialRestMinutes: 20,
    foldCount: sheetPan || sourdough ? 3 : 2,
    foldIntervalMinutes: 30,
    roomBulkMinutes: sourdough ? 240 : sameDay ? 360 : 90,
    coldFermentMinutes: sameDay ? 0 : 48 * 60,
    warmUpMinutes: sheetPan ? 30 : 120,
    finalProofMinutes: sheetPan ? 120 : 0,
    preheatMinutes: sheetPan ? 45 : 60,
    divideBallMinutes: sheetPan ? 0 : 20,
    panMinutes: sheetPan ? 15 : 0,
    shapeTopMinutes: 15,
    bakeMinutes: sheetPan ? 22 : 8,
    includeLevainPrep: sourdough,
    levainPrepMinutes: sourdough ? 8 * 60 : 0,
    roomTemperatureF: 72,
    refrigeratorTemperatureF: 38,
    intendedDoughTemperatureF: 76,
    customStages: [],
  };
}

export function applyFermentationTemplate(
  templateId: FermentationTemplateId,
  plan: FermentationPlanInput,
  input: DoughFormulaInput
): FermentationPlanInput {
  const sheetPan = input.sizing.shape === "rectangular";
  const template: Partial<FermentationPlanInput> =
    templateId === "new-york-cold"
      ? {
          coldFermentMinutes: 48 * 60,
          roomBulkMinutes: 90,
          warmUpMinutes: 120,
          finalProofMinutes: 0,
          foldCount: 2,
        }
      : templateId === "new-york-same-day"
        ? {
            coldFermentMinutes: 0,
            roomBulkMinutes: 5 * 60,
            warmUpMinutes: 0,
            finalProofMinutes: 0,
            foldCount: 3,
          }
        : templateId === "neapolitan-home"
          ? {
              coldFermentMinutes: 0,
              roomBulkMinutes: 8 * 60,
              warmUpMinutes: 0,
              finalProofMinutes: 0,
              foldCount: 2,
            }
          : templateId === "sicilian-sheet-pan"
            ? {
                coldFermentMinutes: 24 * 60,
                roomBulkMinutes: 120,
                warmUpMinutes: 30,
                finalProofMinutes: 150,
                panMinutes: 15,
                foldCount: 3,
              }
            : templateId === "grandma"
              ? {
                  coldFermentMinutes: 0,
                  roomBulkMinutes: 120,
                  warmUpMinutes: 0,
                  finalProofMinutes: 75,
                  panMinutes: 15,
                  foldCount: 1,
                }
              : templateId === "sourdough-round"
                ? {
                    coldFermentMinutes: 24 * 60,
                    roomBulkMinutes: 4 * 60,
                    warmUpMinutes: 120,
                    finalProofMinutes: 0,
                    includeLevainPrep: true,
                    levainPrepMinutes: 8 * 60,
                    foldCount: 3,
                  }
                : templateId === "sourdough-sheet-pan"
                  ? {
                      coldFermentMinutes: 24 * 60,
                      roomBulkMinutes: 4 * 60,
                      warmUpMinutes: 30,
                      finalProofMinutes: 150,
                      panMinutes: 15,
                      includeLevainPrep: true,
                      levainPrepMinutes: 8 * 60,
                      foldCount: 3,
                    }
                  : templateId === "hybrid-cold"
                    ? {
                        coldFermentMinutes: 36 * 60,
                        roomBulkMinutes: 150,
                        warmUpMinutes: sheetPan ? 30 : 120,
                        finalProofMinutes: sheetPan ? 120 : 0,
                        panMinutes: sheetPan ? 15 : 0,
                        includeLevainPrep: true,
                        levainPrepMinutes: 6 * 60,
                        foldCount: 3,
                      }
                    : {};
  return { ...plan, ...template, templateId };
}

function insertCustomStages(
  sources: StageSource[],
  customStages: CustomFermentationStage[],
  position: CustomFermentationStage["position"],
  beforeId: string
): StageSource[] {
  const custom = customStages
    .filter((stage) => stage.position === position)
    .map((stage) =>
      stage.activeWork
        ? active(stage.id, "custom", stage.label, stage.durationMinutes, {
            advisory: stage.notes,
          })
        : waiting(stage.id, "custom", stage.label, stage.durationMinutes, {
            advisory: stage.notes,
          })
    );
  const index = sources.findIndex((stage) => stage.id === beforeId);
  if (index < 0) return [...sources, ...custom];
  return [...sources.slice(0, index), ...custom, ...sources.slice(index)];
}

export function createFermentationStageSources(
  plan: FermentationPlanInput,
  input: DoughFormulaInput
): StageSource[] {
  const sheetPan = input.sizing.shape === "rectangular";
  let sources: StageSource[] = [];
  if (plan.includeLevainPrep && plan.levainPrepMinutes > 0)
    sources.push(
      waiting(
        "levain-prep",
        "ingredient-prep",
        "Prepare levain or refresh starter",
        plan.levainPrepMinutes,
        {
          advisory:
            "Starter readiness is observed, not predicted by the clock.",
        }
      )
    );
  if (plan.ingredientPrepMinutes > 0)
    sources.push(
      active(
        "ingredient-prep",
        "ingredient-prep",
        "Weigh ingredients",
        plan.ingredientPrepMinutes
      )
    );
  sources.push(active("mix", "mix", "Mix dough", plan.mixMinutes));
  sources = insertCustomStages(
    sources,
    plan.customStages,
    "after-mix",
    "not-found"
  );
  if (plan.initialRestMinutes > 0)
    sources.push(
      waiting("initial-rest", "rest", "Initial rest", plan.initialRestMinutes)
    );
  for (let index = 0; index < plan.foldCount; index += 1) {
    if (plan.foldIntervalMinutes > 0)
      sources.push(
        waiting(
          `fold-wait-${index + 1}`,
          "rest",
          `Rest before fold ${index + 1}`,
          plan.foldIntervalMinutes
        )
      );
    sources.push(active(`fold-${index + 1}`, "folds", `Fold ${index + 1}`, 5));
  }
  if (plan.roomBulkMinutes > 0)
    sources.push(
      waiting(
        "room-bulk",
        "room-bulk",
        "Room-temperature bulk",
        plan.roomBulkMinutes,
        {
          temperatureF: plan.roomTemperatureF,
          advisory: "Judge strength, aeration, and elasticity as well as time.",
        }
      )
    );
  if (!sheetPan && plan.divideBallMinutes > 0) {
    sources.push(
      active(
        "divide",
        "divide",
        "Divide dough",
        Math.ceil(plan.divideBallMinutes / 2)
      )
    );
    sources.push(
      active(
        "ball",
        "ball",
        "Ball dough",
        Math.floor(plan.divideBallMinutes / 2)
      )
    );
  }
  sources = insertCustomStages(
    sources,
    plan.customStages,
    "before-cold",
    "not-found"
  );
  if (plan.coldFermentMinutes > 0) {
    sources.push(
      waiting(
        "cold-ferment",
        "cold-ferment",
        "Cold ferment",
        plan.coldFermentMinutes,
        {
          temperatureF: plan.refrigeratorTemperatureF,
        }
      )
    );
    sources.push(
      active(
        "remove-from-cold",
        "remove-from-cold",
        "Remove from refrigerator",
        2
      )
    );
  }
  if (plan.warmUpMinutes > 0)
    sources.push(
      waiting("warm-up", "warm-up", "Warm up", plan.warmUpMinutes, {
        temperatureF: plan.roomTemperatureF,
      })
    );
  if (sheetPan && plan.panMinutes > 0)
    sources.push(active("pan", "pan", "Pan dough", plan.panMinutes));
  if (sheetPan && plan.finalProofMinutes > 0)
    sources.push(
      waiting(
        "final-proof",
        "final-proof",
        "Final proof in pan",
        plan.finalProofMinutes,
        {
          temperatureF: plan.roomTemperatureF,
          advisory:
            "Look for relaxation and visible aeration; the clock is only a guide.",
        }
      )
    );
  if (plan.preheatMinutes > 0)
    sources.push(
      waiting(
        "preheat",
        "preheat",
        sheetPan ? "Preheat oven" : "Preheat baking surface",
        plan.preheatMinutes
      )
    );
  sources = insertCustomStages(
    sources,
    plan.customStages,
    "before-bake",
    "not-found"
  );
  if (!sheetPan)
    sources.push(
      active(
        "shape",
        "shape",
        "Stretch dough",
        Math.ceil(plan.shapeTopMinutes / 2)
      )
    );
  sources.push(
    active(
      "top",
      "top",
      "Top pizza",
      sheetPan ? plan.shapeTopMinutes : Math.floor(plan.shapeTopMinutes / 2)
    )
  );
  sources.push(active("bake", "bake", "Bake", plan.bakeMinutes));
  return sources.filter(
    (source) => source.durationMinutes > 0 || source.id === "mix"
  );
}

export function validateFermentationPlan(
  input: unknown
):
  { ok: true; value: FermentationPlanInput } | { ok: false; errors: string[] } {
  const parsed = fermentationPlanInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  if (parseLocalAnchor(parsed.data.anchorLocalDateTime) === null)
    return {
      ok: false,
      errors: ["Choose a valid local anchor date and time."],
    };
  return { ok: true, value: parsed.data };
}

function timelineAdvisories(
  plan: FermentationPlanInput,
  stages: FermentationStage[],
  now: number
): FermentationAdvisory[] {
  const advisories: FermentationAdvisory[] = [];
  if (plan.roomBulkMinutes > 12 * 60)
    advisories.push({
      code: "long-room-bulk",
      message:
        "This is a very long room-temperature fermentation. Watch the dough closely.",
    });
  if (plan.warmUpMinutes > 6 * 60)
    advisories.push({
      code: "long-warm-up",
      message:
        "This warm-up is unusually long; dough condition may move faster than the plan.",
    });
  if (plan.coldFermentMinutes > 0 && plan.coldFermentMinutes < 8 * 60)
    advisories.push({
      code: "short-cold-ferment",
      message:
        "This cold-ferment window is short and may behave more like a cool rest.",
    });
  if ((plan.roomTemperatureF ?? 0) > 82)
    advisories.push({
      code: "warm-room",
      message:
        "The entered room temperature is warm; fermentation may advance quickly.",
    });
  if ((plan.refrigeratorTemperatureF ?? 0) > 42)
    advisories.push({
      code: "warm-refrigerator",
      message:
        "The entered refrigerator temperature is above 42°F; dough may remain quite active.",
    });
  if (detectTimezoneOffsetChange(stages))
    advisories.push({
      code: "offset-change",
      message:
        "This schedule crosses a daylight-saving offset change. Confirm each local time.",
    });
  if (stages[0] && stages[0].startTimestamp < now)
    advisories.push({
      code: "starts-in-past",
      message: "At least one planned stage starts in the past.",
    });
  if (stages.at(-1) && stages.at(-1)!.endTimestamp < now)
    advisories.push({
      code: "schedule-in-past",
      message: "The entire planned schedule is already in the past.",
    });
  return advisories;
}

export function calculateFermentationTimeline(
  planInput: FermentationPlanInput,
  input: DoughFormulaInput,
  now = Date.now()
): FermentationTimelineResult {
  const validated = validateFermentationPlan(planInput);
  if (!validated.ok) return validated;
  const plan = validated.value;
  if (!plan.enabled)
    return { ok: false, errors: ["Enable the fermentation plan first."] };
  const anchor = parseLocalAnchor(plan.anchorLocalDateTime);
  if (anchor === null)
    return {
      ok: false,
      errors: ["Choose a valid local anchor date and time."],
    };
  const sources = createFermentationStageSources(plan, input);
  if (sources.length === 0)
    return { ok: false, errors: ["Add at least one usable schedule stage."] };
  const totalMinutes = sources.reduce(
    (total, source) => total + source.durationMinutes,
    0
  );
  let cursor =
    plan.direction === "forward-from-mix"
      ? anchor -
        sources
          .slice(
            0,
            sources.findIndex((source) => source.id === "mix")
          )
          .reduce((total, source) => total + source.durationMinutes * 60_000, 0)
      : anchor -
        sources.reduce(
          (total, source) => total + source.durationMinutes * 60_000,
          0
        ) +
        (sources.at(-1)?.durationMinutes ?? 0) * 60_000;
  const stages = sources.map((source) => {
    const startTimestamp = cursor;
    cursor += source.durationMinutes * 60_000;
    return { ...source, startTimestamp, endTimestamp: cursor };
  });
  const mix = stages.find((stage) => stage.id === "mix") ?? stages[0];
  const bake = stages.find((stage) => stage.id === "bake") ?? stages.at(-1)!;
  return {
    ok: true,
    value: {
      stages,
      mixTimestamp: mix.startTimestamp,
      bakeTimestamp: bake.startTimestamp,
      totalDurationMinutes: totalMinutes,
      advisories: timelineAdvisories(plan, stages, now),
    },
  };
}

export function createForwardFermentationTimeline(
  plan: FermentationPlanInput,
  input: DoughFormulaInput,
  now?: number
): FermentationTimelineResult {
  return calculateFermentationTimeline(
    { ...plan, direction: "forward-from-mix" },
    input,
    now
  );
}

export function createBackwardFermentationTimeline(
  plan: FermentationPlanInput,
  input: DoughFormulaInput,
  now?: number
): FermentationTimelineResult {
  return calculateFermentationTimeline(
    { ...plan, direction: "backward-from-bake" },
    input,
    now
  );
}

export function detectTimezoneOffsetChange(
  stages: readonly Pick<FermentationStage, "startTimestamp" | "endTimestamp">[]
): boolean {
  if (stages.length === 0) return false;
  const startOffset = new Date(stages[0].startTimestamp).getTimezoneOffset();
  return stages.some(
    (stage) =>
      new Date(stage.startTimestamp).getTimezoneOffset() !== startOffset ||
      new Date(stage.endTimestamp).getTimezoneOffset() !== startOffset
  );
}

export function formatTimelineDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const days = Math.floor(rounded / 1440);
  const hours = Math.floor((rounded % 1440) / 60);
  const remaining = rounded % 60;
  return [
    days > 0 ? `${days}d` : "",
    hours > 0 ? `${hours}h` : "",
    remaining > 0 || (days === 0 && hours === 0) ? `${remaining}m` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function formatTimelineTimestamp(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(timestamp);
}
