import { z } from "zod";

import { siteConfig } from "@/config/site";
import { createFormulaSignatureData } from "./formula-signature";
import {
  BAKE_REPORT_SCHEMA_VERSION,
  bakingSessionV1Schema,
  shiftedTimelineStages,
  type BakingSessionV1,
} from "./baking-session";
import {
  formatTimelineDuration,
  formatTimelineTimestamp,
  type FermentationTimeline,
} from "./fermentation";

export const bakeReportV1Schema = z.object({
  schemaVersion: z.literal(BAKE_REPORT_SCHEMA_VERSION),
  generatedAt: z.iso.datetime(),
  session: bakingSessionV1Schema,
});

export type BakeReportV1 = z.infer<typeof bakeReportV1Schema>;

export function createBakeReport(
  session: BakingSessionV1,
  now = new Date()
): BakeReportV1 {
  return {
    schemaVersion: BAKE_REPORT_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    session,
  };
}

export function serializeBakeReport(report: BakeReportV1): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatBakeReportAsPlainText(
  session: BakingSessionV1,
  timeline: FermentationTimeline
): string {
  const signature = createFormulaSignatureData(
    session.recipeDocument.calculatorInput
  );
  const shifted = shiftedTimelineStages(timeline, session.shifts);
  const lines = [
    session.recipeDocument.name,
    "BAKE REPORT",
    `Formula identity: ${signature.accessibleLabel}`,
    `Session: ${session.status}`,
    "",
    "PLANNED & ACTUAL SCHEDULE",
  ];
  shifted.forEach((stage, index) => {
    const original = timeline.stages[index];
    const execution = session.stages[stage.id];
    const timingChanged = original.startTimestamp !== stage.startTimestamp;
    lines.push(
      `${execution?.status === "skipped" ? "[SKIPPED] " : ""}${stage.label}: ${formatTimelineTimestamp(stage.startTimestamp)} (${formatTimelineDuration(stage.durationMinutes)})${timingChanged ? ` · originally ${formatTimelineTimestamp(original.startTimestamp)}` : ""}`
    );
    if (execution?.actualCompletedAt)
      lines.push(
        `  Actual completion: ${formatTimelineTimestamp(Date.parse(execution.actualCompletedAt))}`
      );
    if (execution?.note) lines.push(`  Note: ${execution.note}`);
  });
  if (session.shifts.length > 0) {
    lines.push(
      "",
      "TIMING CHANGES",
      ...session.shifts.map(
        (shift) =>
          `${shift.afterStageId}: ${shift.deltaMinutes >= 0 ? "+" : ""}${shift.deltaMinutes} minutes (${shift.reason})`
      )
    );
  }
  lines.push("", "SESSION NOTES", session.generalNotes || "No general notes.");
  if (session.actualRoomTemperatureF !== undefined)
    lines.push(`Actual room temperature: ${session.actualRoomTemperatureF}°F`);
  if (session.actualRefrigeratorTemperatureF !== undefined)
    lines.push(
      `Actual refrigerator temperature: ${session.actualRefrigeratorTemperatureF}°F`
    );
  if (session.actualBakeDurationMinutes !== undefined)
    lines.push(
      `Actual bake duration: ${session.actualBakeDurationMinutes} minutes`
    );
  if (session.ovenSetting) lines.push(`Oven setting: ${session.ovenSetting}`);
  if (session.resultRating !== undefined)
    lines.push(`Result rating: ${session.resultRating}/5`);
  if (session.resultObservations)
    lines.push(`Result observations: ${session.resultObservations}`);
  lines.push("", siteConfig.productionUrl);
  return lines.join("\n");
}
