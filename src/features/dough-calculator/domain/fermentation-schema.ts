import { z } from "zod";

import type { FermentationPlanInput } from "./fermentation";

const direction = z.enum(["forward-from-mix", "backward-from-bake"]);
const template = z.enum([
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
const duration = z
  .number()
  .finite()
  .int()
  .min(0)
  .max(60 * 24 * 30);
const customStage = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(80),
  durationMinutes: duration,
  activeWork: z.boolean().default(false),
  position: z.enum(["after-mix", "before-cold", "before-bake"]),
  notes: z.string().trim().max(500).optional(),
});

export const fermentationPlanInputSchema: z.ZodType<FermentationPlanInput> = z
  .object({
    enabled: z.boolean(),
    templateId: template,
    direction,
    anchorLocalDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    timezone: z.string().trim().min(1).max(100),
    ingredientPrepMinutes: duration,
    mixMinutes: duration,
    initialRestMinutes: duration,
    foldCount: z.number().finite().int().min(0).max(12),
    foldIntervalMinutes: duration,
    roomBulkMinutes: duration,
    coldFermentMinutes: duration,
    warmUpMinutes: duration,
    finalProofMinutes: duration,
    preheatMinutes: duration,
    divideBallMinutes: duration,
    panMinutes: duration,
    shapeTopMinutes: duration,
    bakeMinutes: duration,
    includeLevainPrep: z.boolean(),
    levainPrepMinutes: duration,
    roomTemperatureF: z.number().finite().min(35).max(120).optional(),
    refrigeratorTemperatureF: z.number().finite().min(20).max(70).optional(),
    intendedDoughTemperatureF: z.number().finite().min(35).max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    customStages: z.array(customStage).max(20),
  })
  .superRefine((plan, context) => {
    const identifiers = new Set<string>();
    plan.customStages.forEach((stage, index) => {
      if (identifiers.has(stage.id))
        context.addIssue({
          code: "custom",
          path: ["customStages", index, "id"],
          message: "Custom stage identifiers must be unique.",
        });
      identifiers.add(stage.id);
    });
    if (plan.foldCount > 0 && plan.foldIntervalMinutes === 0)
      context.addIssue({
        code: "custom",
        path: ["foldIntervalMinutes"],
        message: "A fold interval is required when folds are planned.",
      });
  });
