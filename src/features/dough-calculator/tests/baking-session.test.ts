import { describe, expect, it } from "vitest";

import {
  adjustTimer,
  createBakingSession,
  extendStage,
  finishStage,
  formatTimerDisplay,
  idleTimer,
  migrateBakingSession,
  pauseTimer,
  shiftedTimelineStages,
  startTimer,
  timerRemainingMs,
} from "../domain/baking-session";
import {
  calculateFermentationTimeline,
  createDefaultFermentationPlan,
} from "../domain/fermentation";
import {
  createBakeReport,
  formatBakeReportAsPlainText,
  serializeBakeReport,
} from "../domain/bake-report";
import { makeRecipeDocument } from "./recipe-fixtures";

function setup() {
  const base = makeRecipeDocument();
  const plan = {
    ...createDefaultFermentationPlan(
      base.calculatorInput,
      base.context,
      new Date(2026, 7, 3)
    ),
    anchorLocalDateTime: "2026-08-06T18:00",
  };
  const document = { ...base, fermentationPlan: plan };
  const result = calculateFermentationTimeline(plan, base.calculatorInput, 0);
  if (!result.ok) throw new Error(result.errors[0]);
  const session = createBakingSession(
    document,
    result.value,
    new Date("2026-08-03T12:00:00.000Z"),
    "session"
  );
  return { document, timeline: result.value, session };
}

describe("Baking Day session and timers", () => {
  it("restores a running timer from timestamps", () => {
    const timer = startTimer(idleTimer(10), 1_000);
    expect(timerRemainingMs(timer, 61_000)).toBe(9 * 60_000);
    expect(migrateBakingSession(setup().session).ok).toBe(true);
  });

  it("pauses and resumes without decrementing source state", () => {
    const running = startTimer(idleTimer(10), 1_000);
    const paused = pauseTimer(running, 61_000);
    expect(timerRemainingMs(paused, 500_000)).toBe(9 * 60_000);
    expect(timerRemainingMs(startTimer(paused, 500_000), 560_000)).toBe(
      8 * 60_000
    );
  });

  it("shows overtime clearly and supports minute adjustment", () => {
    const timer = startTimer(idleTimer(1), 0);
    expect(formatTimerDisplay(timerRemainingMs(timer, 90_000))).toBe(
      "+0:00:30"
    );
    expect(adjustTimer(timer, 1, 0).durationMs).toBe(2 * 60_000);
  });

  it("completes and skips stages while keeping planned times by default", () => {
    const { timeline, session } = setup();
    const first = timeline.stages[0];
    const completed = finishStage(session, timeline, first.id, {
      now: new Date(first.endTimestamp + 30 * 60_000),
    });
    expect(completed.stages[first.id].status).toBe("completed");
    expect(completed.shifts).toHaveLength(0);
    const skipped = finishStage(session, timeline, first.id, { skip: true });
    expect(skipped.stages[first.id].status).toBe("skipped");
  });

  it("shifts remaining stages only after an explicit choice", () => {
    const { timeline, session } = setup();
    const first = timeline.stages[0];
    const shifted = finishStage(session, timeline, first.id, {
      now: new Date(first.endTimestamp + 30 * 60_000),
      shiftRemaining: true,
    });
    expect(shifted.shifts[0].deltaMinutes).toBe(30);
    const stages = shiftedTimelineStages(timeline, shifted.shifts);
    expect(stages[1].startTimestamp).toBe(
      timeline.stages[1].startTimestamp + 30 * 60_000
    );
    expect(stages[0].startTimestamp).toBe(timeline.stages[0].startTimestamp);
  });

  it("records an observation extension and preserves the original timeline", () => {
    const { timeline, session } = setup();
    const first = timeline.stages[0];
    const extended = extendStage(session, first.id, 15, true);
    expect(extended.stages[first.id].observation).toBe("needs-more-time");
    expect(extended.shifts[0].reason).toBe("observation");
    expect(timeline.stages[1].startTimestamp).not.toBe(
      shiftedTimelineStages(timeline, extended.shifts)[1].startTimestamp
    );
  });

  it("formats deterministic text and JSON bake reports", () => {
    const { timeline, session } = setup();
    const text = formatBakeReportAsPlainText(
      { ...session, generalNotes: "Great bottom color." },
      timeline
    );
    expect(text).toMatch(/BAKE REPORT/);
    expect(text).toMatch(/Great bottom color/);
    expect(text).toMatch(/pizzadough\.southjerseysourdough\.com/);
    const json = serializeBakeReport(
      createBakeReport(session, new Date("2026-08-03T13:00:00.000Z"))
    );
    expect(JSON.parse(json).schemaVersion).toBe(1);
  });
});
