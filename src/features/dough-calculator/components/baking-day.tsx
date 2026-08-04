"use client";

import {
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  Clock3Icon,
  ExternalLinkIcon,
  MinusIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  SunIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  adjustTimer,
  createBakingSession,
  completeBakingSession,
  completeTimer,
  extendStage,
  finishStage,
  formatTimerDisplay,
  idleTimer,
  pauseTimer,
  readBakingSession,
  resetTimer,
  returnStageToActive,
  shiftedTimelineStages,
  startTimer,
  timerRemainingMs,
  writeBakingSession,
  type BakingSessionV1,
} from "../domain/baking-session";
import {
  createBakeReport,
  formatBakeReportAsPlainText,
  serializeBakeReport,
} from "../domain/bake-report";
import {
  calculateFermentationTimeline,
  formatTimelineDuration,
  formatTimelineTimestamp,
} from "../domain/fermentation";
import { createBakingInstructions } from "../domain/instructions";
import { createRecipePresentationModel } from "../utils/recipe-presentation";
import { sanitizeRecipeFilename } from "../utils/recipe-format";
import { FormulaSignature } from "./formula-signature";
import { FermentationTimelineView } from "./fermentation-timeline";

type WakeLockLike = EventTarget & {
  released: boolean;
  release: () => Promise<void>;
};

type CompletionChoice = { stageId: string; skip: boolean } | null;

export function BakingDay() {
  const { resolvedTheme, setTheme } = useTheme();
  const [session, setSession] = useState<BakingSessionV1 | null>(null);
  const [loadMessage, setLoadMessage] = useState("Loading Baking Day session…");
  const [now, setNow] = useState(() => Date.now());
  const [completionChoice, setCompletionChoice] =
    useState<CompletionChoice>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [wakeWanted, setWakeWanted] = useState(false);
  const [wakeStatus, setWakeStatus] = useState("Screen wake lock is off.");
  const [notificationStatus, setNotificationStatus] = useState(
    "Timer alerts are in-app only."
  );
  const wakeLockRef = useRef<WakeLockLike | null>(null);
  const timerAnnouncedRef = useRef(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const result = readBakingSession();
      if (result.ok && result.value) {
        setSession(result.value);
        setLoadMessage("");
      } else {
        setLoadMessage(
          result.ok
            ? "No Baking Day session is ready. Create a fermentation plan in the calculator first."
            : result.message
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const persist = useCallback((next: BakingSessionV1) => {
    const result = writeBakingSession(next);
    if (result.ok) setSession(result.value);
    else setStatusMessage(result.message);
  }, []);

  const baseTimeline = useMemo(() => {
    const plan = session?.recipeDocument.fermentationPlan;
    if (!session || !plan?.enabled) return null;
    const result = calculateFermentationTimeline(
      plan,
      session.recipeDocument.calculatorInput
    );
    return result.ok ? result.value : null;
  }, [session]);

  const stages = useMemo(
    () =>
      session && baseTimeline
        ? shiftedTimelineStages(baseTimeline, session.shifts)
        : [],
    [baseTimeline, session]
  );
  const currentStage = stages.find(
    (stage) => stage.id === session?.currentStageId
  );
  const currentIndex = stages.findIndex(
    (stage) => stage.id === session?.currentStageId
  );
  const nextStage = stages[currentIndex + 1];
  const presentation = session
    ? createRecipePresentationModel(session.recipeDocument)
    : null;
  const model = presentation?.ok ? presentation.value : null;
  const instructions =
    session && currentStage
      ? createBakingInstructions(session.recipeDocument, currentStage.type)
      : null;
  const timerRemaining = session?.timer
    ? timerRemainingMs(session.timer, now)
    : null;

  useEffect(() => {
    if (
      !session?.timer ||
      session.timer.status !== "running" ||
      timerRemaining === null ||
      timerRemaining > 0 ||
      timerAnnouncedRef.current
    )
      return;
    timerAnnouncedRef.current = true;
    const next = {
      ...session,
      timer: completeTimer(session.timer),
      updatedAt: new Date().toISOString(),
    };
    persist(next);
    setStatusMessage(`${currentStage?.label ?? "Stage"} timer is complete.`);
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    )
      new Notification(`${currentStage?.label ?? "Stage"} is ready`, {
        body: "Return to your Baking Day session when convenient.",
      });
  }, [currentStage?.label, persist, session, timerRemaining]);

  const requestWakeLock = useCallback(async () => {
    const navigatorWithWakeLock = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> };
    };
    if (!navigatorWithWakeLock.wakeLock) {
      setWakeWanted(false);
      setWakeStatus("Screen Wake Lock is not supported in this browser.");
      return;
    }
    try {
      const sentinel = await navigatorWithWakeLock.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      setWakeStatus(
        "Screen will stay awake while this page is visible. This can use more battery."
      );
      sentinel.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch {
      setWakeWanted(false);
      setWakeStatus("The browser did not allow the screen wake lock.");
    }
  }, []);

  const toggleWakeLock = async () => {
    if (wakeWanted) {
      setWakeWanted(false);
      await wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setWakeStatus("Screen wake lock is off.");
    } else {
      setWakeWanted(true);
      await requestWakeLock();
    }
  };

  useEffect(() => {
    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        wakeWanted &&
        !wakeLockRef.current
      )
        void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void wakeLockRef.current?.release();
    };
  }, [requestWakeLock, wakeWanted]);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      setNotificationStatus("Browser notifications are not supported here.");
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationStatus(
        "Notifications are denied in browser settings. In-app completion remains available."
      );
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(
      permission === "granted"
        ? "Best-effort timer notifications are enabled while the application remains available."
        : "Notifications were not enabled. In-app timer completion still works."
    );
  };

  const updateSession = (patch: Partial<BakingSessionV1>) => {
    if (!session) return;
    persist({ ...session, ...patch, updatedAt: new Date().toISOString() });
  };

  const beginTimer = () => {
    if (!session || !currentStage) return;
    timerAnnouncedRef.current = false;
    const timer = session.timer ?? idleTimer(currentStage.durationMinutes);
    persist({
      ...session,
      timer: startTimer(timer),
      timerStageId: currentStage.id,
      updatedAt: new Date().toISOString(),
    });
  };

  const pauseCurrentTimer = () => {
    if (!session?.timer) return;
    persist({
      ...session,
      timer: pauseTimer(session.timer),
      updatedAt: new Date().toISOString(),
    });
  };

  const resetCurrentTimer = () => {
    if (!session?.timer) return;
    timerAnnouncedRef.current = false;
    persist({
      ...session,
      timer: resetTimer(session.timer),
      updatedAt: new Date().toISOString(),
    });
  };

  const adjustCurrentTimer = (minutes: number) => {
    if (!session?.timer) return;
    persist({
      ...session,
      timer: adjustTimer(session.timer, minutes),
      updatedAt: new Date().toISOString(),
    });
  };

  const finish = (shiftRemaining: boolean) => {
    if (!session || !baseTimeline || !completionChoice) return;
    const next = finishStage(session, baseTimeline, completionChoice.stageId, {
      skip: completionChoice.skip,
      shiftRemaining,
    });
    persist(next);
    setCompletionChoice(null);
    setStatusMessage(
      `${currentStage?.label ?? "Stage"} ${completionChoice.skip ? "skipped" : "completed"}. ${shiftRemaining ? "Remaining times shifted." : "Original remaining times kept."}`
    );
  };

  const setObservation = (
    observation: "looks-ready" | "needs-more-time" | "not-sure"
  ) => {
    if (!session || !currentStage) return;
    persist({
      ...session,
      stages: {
        ...session.stages,
        [currentStage.id]: {
          ...session.stages[currentStage.id],
          observation,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const extend = (minutes: number) => {
    if (!session || !currentStage) return;
    persist(extendStage(session, currentStage.id, minutes, true));
    setStatusMessage(
      `Added ${minutes} minutes and shifted the remaining schedule with your confirmation.`
    );
  };

  const writeClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage("Bake report copied.");
    } catch {
      setStatusMessage("Clipboard access is unavailable in this browser.");
    }
  };

  const downloadReport = () => {
    if (!session) return;
    const blob = new Blob([serializeBakeReport(createBakeReport(session))], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = sanitizeRecipeFilename(
      `${session.recipeDocument.name}-bake-report`,
      "json"
    );
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatusMessage("Bake report JSON downloaded.");
  };

  if (!session || !baseTimeline || !currentStage) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-5">
        <section className="surface-workbench max-w-lg p-6">
          <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
            Baking Day
          </p>
          <h1 className="mt-2 text-xl font-medium">No active kitchen plan</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {loadMessage}
          </p>
          <Button render={<Link href="/" />} className="mt-5 rounded-md">
            Return to calculator
          </Button>
        </section>
      </main>
    );
  }

  const completedIds = Object.entries(session.stages)
    .filter(([, value]) => value.status === "completed")
    .map(([id]) => id);
  const currentExecution = session.stages[currentStage.id];
  const scheduledDelta = currentStage.startTimestamp - now;
  const sessionComplete = session.status === "complete";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <header className="border-b-[0.5px] border-graphite bg-carbon">
        <div className="mx-auto flex h-13 max-w-[88rem] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
              Baking Day / Live
            </p>
            <h1 className="truncate text-sm font-medium">
              {session.recipeDocument.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button
              render={<Link href="/" />}
              size="sm"
              variant="outline"
              className="rounded-md"
            >
              Calculator
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[88rem] gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        {sessionComplete ? (
          <section className="surface-result flex flex-col justify-between gap-3 border-acid-lime/60 p-4 sm:flex-row sm:items-center sm:p-5 lg:col-span-2">
            <div>
              <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
                Session complete
              </p>
              <h2 className="mt-1 text-xl font-medium">
                Bake recorded locally
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Add final observations, then copy or download the durable bake
                report. The original recipe remains unchanged.
              </p>
            </div>
            <CheckIcon className="size-8 shrink-0 text-acid-lime" />
          </section>
        ) : null}
        <div className="grid min-w-0 content-start gap-4">
          <section
            className="surface-result grid gap-4 p-4 sm:p-6"
            aria-labelledby="current-stage-heading"
            data-current-task
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
                  Stage {currentIndex + 1} / {stages.length} · Do this now
                </p>
                <h2
                  id="current-stage-heading"
                  className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl"
                >
                  {currentStage.label}
                </h2>
                <p className="tabular mt-1 text-xs text-muted-foreground">
                  Scheduled{" "}
                  {formatTimelineTimestamp(currentStage.startTimestamp)}
                  {scheduledDelta > 0
                    ? ` · in ${formatTimelineDuration(scheduledDelta / 60_000)}`
                    : ` · ${formatTimelineDuration(Math.abs(scheduledDelta) / 60_000)} elapsed`}
                </p>
              </div>
              <FormulaSignature
                data={model!.signature}
                className="size-16 shrink-0 sm:size-20"
              />
            </div>

            <div className="surface-inset grid place-items-center px-3 py-4">
              <p
                className={cn(
                  "tabular font-mono text-[clamp(2.6rem,13vw,5.5rem)] leading-none tracking-[-0.06em]",
                  timerRemaining !== null && timerRemaining < 0
                    ? "text-warning"
                    : "text-foreground"
                )}
                aria-label={
                  timerRemaining === null
                    ? "No stage timer started"
                    : timerRemaining < 0
                      ? `${formatTimerDisplay(timerRemaining)} overtime`
                      : `${formatTimerDisplay(timerRemaining)} remaining`
                }
              >
                {timerRemaining === null
                  ? formatTimerDisplay(currentStage.durationMinutes * 60_000)
                  : formatTimerDisplay(timerRemaining)}
              </p>
              <p className="mt-2 font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                {timerRemaining !== null && timerRemaining < 0
                  ? "Overtime"
                  : session.timer?.status === "running"
                    ? "Remaining"
                    : session.timer?.status === "paused"
                      ? "Paused"
                      : "Planned stage duration"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {session.timer?.status === "running" ? (
                  <Button
                    onClick={pauseCurrentTimer}
                    className="min-h-11 rounded-md"
                  >
                    <PauseIcon /> Pause
                  </Button>
                ) : (
                  <Button onClick={beginTimer} className="min-h-11 rounded-md">
                    <PlayIcon />
                    {session.timer?.status === "paused"
                      ? "Resume"
                      : "Start timer"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="min-h-11 rounded-md"
                  onClick={() => adjustCurrentTimer(-1)}
                  disabled={!session.timer}
                  aria-label="Subtract one minute"
                >
                  <MinusIcon /> 1 min
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 rounded-md"
                  onClick={() => adjustCurrentTimer(1)}
                  disabled={!session.timer}
                  aria-label="Add one minute"
                >
                  <PlusIcon /> 1 min
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11 rounded-md"
                  onClick={resetCurrentTimer}
                  disabled={!session.timer}
                >
                  <RotateCcwIcon /> Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentStage.type === "mix" && model ? (
                <div className="surface-instrument p-3 sm:col-span-2">
                  <p className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
                    Exact weights
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
                    {model.mainIngredients.map((ingredient) => (
                      <span
                        key={ingredient.id}
                        className="flex justify-between gap-2 text-sm"
                      >
                        <span className="truncate text-muted-foreground">
                          {ingredient.label}
                        </span>
                        <strong className="tabular font-mono font-normal whitespace-nowrap">
                          {ingredient.grams.toFixed(
                            ingredient.grams < 10 ? 1 : 0
                          )}{" "}
                          g
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {currentStage.type === "ball" && model ? (
                <KitchenFact
                  label="Divide"
                  value={`${model.quantity} × ${Math.round(model.doughWeightPerUnitGrams)} g`}
                  detail={`${Math.round(model.totalDoughWeightGrams)} g total; a few grams of tolerance is practical.`}
                />
              ) : null}
              {currentStage.type === "pan" && model ? (
                <KitchenFact
                  label="Pan"
                  value={model.size}
                  detail={`${Math.round(model.doughWeightPerUnitGrams)} g per pan. Oil the measured interior evenly.`}
                />
              ) : null}
              {currentStage.type === "bake" && model ? (
                <KitchenFact
                  label="Bake setup"
                  value={model.surface}
                  detail="Confirm the preheat, then use edge and bottom color—not the timer alone—for doneness."
                />
              ) : null}
              {instructions?.instructions.map((instruction) => (
                <KitchenFact
                  key={instruction.id}
                  label={instruction.title}
                  value={instruction.detail}
                />
              ))}
            </div>

            <p className="border-l-2 border-acid-lime pl-3 text-xs leading-relaxed text-muted-foreground">
              {instructions?.observation}
            </p>

            {(currentStage.type === "room-bulk" ||
              currentStage.type === "final-proof") && (
              <div className="surface-instrument p-3">
                <p className="text-xs font-medium">Dough observation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional: record what you see. No percentage-rise target is
                  universal.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["looks-ready", "Looks ready"],
                    ["needs-more-time", "Needs more time"],
                    ["not-sure", "Not sure"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={
                        currentExecution?.observation === value
                          ? "default"
                          : "outline"
                      }
                      className="min-h-10 rounded-md"
                      onClick={() =>
                        setObservation(
                          value as
                            "looks-ready" | "needs-more-time" | "not-sure"
                        )
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                {currentExecution?.observation === "needs-more-time" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t-[0.5px] border-graphite pt-3">
                    <span className="text-xs text-muted-foreground">
                      Extend and shift remaining stages:
                    </span>
                    {[15, 30, 60].map((minutes) => (
                      <Button
                        key={minutes}
                        size="xs"
                        variant="outline"
                        onClick={() => extend(minutes)}
                      >
                        +{minutes} min
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                className="min-h-12 rounded-md bg-acid-lime text-void hover:bg-acid-lime/85"
                onClick={() =>
                  setCompletionChoice({ stageId: currentStage.id, skip: false })
                }
              >
                <CheckIcon /> Mark complete
              </Button>
              <Button
                variant="outline"
                className="min-h-12 rounded-md"
                aria-label="Skip current stage"
                onClick={() =>
                  setCompletionChoice({ stageId: currentStage.id, skip: true })
                }
              >
                <SkipForwardIcon />
              </Button>
            </div>
          </section>

          <section className="surface-workbench p-4 sm:p-5">
            <p className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
              Next
            </p>
            {nextStage ? (
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-medium">{nextStage.label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextStage.activeWork
                      ? "Prepare for active work."
                      : "A resting or waiting stage follows."}
                  </p>
                </div>
                <div className="tabular shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  <p>{formatTimelineTimestamp(nextStage.startTimestamp)}</p>
                  <p className="mt-1">
                    {formatTimelineDuration(nextStage.durationMinutes)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                This is the final planned stage.
              </p>
            )}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-4">
          <section className="surface-workbench overflow-hidden">
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium"
              aria-expanded={timelineOpen}
              onClick={() => setTimelineOpen((open) => !open)}
            >
              Full timeline
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  timelineOpen && "rotate-180"
                )}
              />
            </button>
            {timelineOpen ? (
              <div className="border-t-[0.5px] border-graphite p-4">
                <FermentationTimelineView
                  stages={stages}
                  currentStageId={currentStage.id}
                  completedStageIds={completedIds}
                  compact
                />
                {Object.entries(session.stages)
                  .filter(([, execution]) =>
                    ["completed", "skipped"].includes(execution.status)
                  )
                  .map(([id]) => (
                    <Button
                      key={id}
                      size="xs"
                      variant="ghost"
                      className="mt-1"
                      onClick={() => persist(returnStageToActive(session, id))}
                    >
                      Return {stages.find((stage) => stage.id === id)?.label} to
                      active
                    </Button>
                  ))}
              </div>
            ) : null}
          </section>

          <section className="surface-workbench overflow-hidden">
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-medium"
              aria-expanded={notesOpen}
              onClick={() => setNotesOpen((open) => !open)}
            >
              Session notes
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  notesOpen && "rotate-180"
                )}
              />
            </button>
            {notesOpen ? (
              <div className="grid gap-3 border-t-[0.5px] border-graphite p-4">
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  General notes
                  <textarea
                    value={session.generalNotes}
                    onChange={(event) =>
                      updateSession({ generalNotes: event.target.value })
                    }
                    className="min-h-24 resize-y rounded-md border-[0.5px] border-input bg-inset p-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />
                </label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Current stage note
                  <textarea
                    value={currentExecution?.note ?? ""}
                    onChange={(event) =>
                      updateSession({
                        stages: {
                          ...session.stages,
                          [currentStage.id]: {
                            ...currentExecution,
                            status: currentExecution?.status ?? "active",
                            note: event.target.value,
                          },
                        },
                      })
                    }
                    className="min-h-20 resize-y rounded-md border-[0.5px] border-input bg-inset p-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <NumberNote
                    label="Actual room °F"
                    value={session.actualRoomTemperatureF}
                    onChange={(value) =>
                      updateSession({ actualRoomTemperatureF: value })
                    }
                  />
                  <NumberNote
                    label="Actual refrigerator °F"
                    value={session.actualRefrigeratorTemperatureF}
                    onChange={(value) =>
                      updateSession({ actualRefrigeratorTemperatureF: value })
                    }
                  />
                  <NumberNote
                    label="Bake duration min"
                    value={session.actualBakeDurationMinutes}
                    onChange={(value) =>
                      updateSession({ actualBakeDurationMinutes: value })
                    }
                  />
                  <label className="grid gap-1.5 text-xs text-muted-foreground">
                    Result rating 1–5
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={session.resultRating ?? ""}
                      onChange={(event) =>
                        updateSession({
                          resultRating: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                    />
                  </label>
                </div>
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Oven setting
                  <Input
                    value={session.ovenSetting ?? ""}
                    onChange={(event) =>
                      updateSession({ ovenSetting: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Result observations
                  <textarea
                    value={session.resultObservations ?? ""}
                    onChange={(event) =>
                      updateSession({ resultObservations: event.target.value })
                    }
                    className="min-h-20 resize-y rounded-md border-[0.5px] border-input bg-inset p-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="surface-workbench grid gap-3 p-4">
            <div>
              <p className="text-xs font-medium">Kitchen display</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Wake Lock is requested only when you turn it on and may use more
                battery. It releases when Baking Day exits.
              </p>
            </div>
            <Button
              variant="outline"
              className="min-h-11 justify-start rounded-md"
              onClick={() => void toggleWakeLock()}
            >
              <Clock3Icon />
              {wakeWanted ? "Allow screen to sleep" : "Keep screen awake"}
            </Button>
            <p role="status" className="text-[11px] text-muted-foreground">
              {wakeStatus}
            </p>
            <div className="border-t-[0.5px] border-graphite pt-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Browser notifications are best-effort while this application
                remains available. They are not closed-browser alarms.
              </p>
              <Button
                variant="outline"
                className="mt-3 min-h-11 w-full justify-start rounded-md"
                onClick={() => void requestNotifications()}
              >
                <BellIcon /> Enable timer notifications
              </Button>
              <p
                role="status"
                className="mt-2 text-[11px] text-muted-foreground"
              >
                {notificationStatus}
              </p>
            </div>
          </section>

          <section className="surface-workbench grid gap-2 p-4">
            {!sessionComplete ? (
              <Button
                variant="outline"
                className="rounded-md"
                onClick={() => {
                  const completed = completeBakingSession(session);
                  persist(completed);
                  setStatusMessage("Baking Day session completed.");
                }}
              >
                End Baking Day session
              </Button>
            ) : null}
            {sessionComplete ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-md"
                  onClick={() =>
                    setStatusMessage("Session notes are saved locally.")
                  }
                >
                  Save Notes
                </Button>
                <Button
                  className="rounded-md"
                  onClick={() =>
                    void writeClipboard(
                      formatBakeReportAsPlainText(session, baseTimeline)
                    )
                  }
                >
                  Copy Bake Report
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md"
                  onClick={downloadReport}
                >
                  Download Bake Report JSON
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md"
                  onClick={() =>
                    persist(
                      createBakingSession(session.recipeDocument, baseTimeline)
                    )
                  }
                >
                  Start Again
                </Button>
                <Button
                  render={<Link href="/" />}
                  variant="ghost"
                  className="rounded-md"
                >
                  Return to Calculator <ExternalLinkIcon />
                </Button>
              </>
            ) : null}
          </section>
        </aside>
      </main>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

      <footer className="border-t-[0.5px] border-graphite px-4 py-5 text-center text-[10px] text-muted-foreground">
        {siteConfig.brand} · local session only · no closed-browser alarm
        guarantee
      </footer>

      <Dialog
        open={completionChoice !== null}
        onOpenChange={(open) => {
          if (!open) setCompletionChoice(null);
        }}
      >
        <DialogContent className="rounded-xl border-[0.5px] border-graphite bg-carbon shadow-none">
          <DialogHeader>
            <DialogTitle>
              {completionChoice?.skip
                ? "Skip this stage?"
                : "Update the remaining schedule?"}
            </DialogTitle>
            <DialogDescription>
              Planned and actual times remain separate. Choose whether this
              early or late completion should move future stage times.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-b-xl border-graphite bg-inset">
            <Button variant="outline" onClick={() => finish(false)}>
              Keep original schedule
            </Button>
            <Button onClick={() => finish(true)}>Shift remaining stages</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KitchenFact({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="surface-instrument p-3">
      <p className="font-mono text-[9px] tracking-[0.08em] text-acid-lime uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function NumberNote({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
      />
    </label>
  );
}
