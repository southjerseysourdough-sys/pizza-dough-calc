"use client";

import {
  CalendarClockIcon,
  ChevronDownIcon,
  PlayIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateFermentationTimeline,
  applyFermentationTemplate,
  createDefaultFermentationPlan,
  formatTimelineDuration,
  formatTimelineTimestamp,
  getCurrentTimezone,
  FERMENTATION_TEMPLATES,
  type FermentationPlanInput,
} from "../domain/fermentation";
import type { PizzaRecipeDocument } from "../domain/recipe-document";
import { useCalculatorStore } from "../store/calculator-store";
import { startBakingDaySession } from "../utils/start-baking-day";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { FermentationTimelineView } from "./fermentation-timeline";

const fieldClass =
  "h-9 rounded-md border-[0.5px] border-input bg-inset px-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function DurationField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
      {label}
      <span className="relative">
        <Input
          type="number"
          min={0}
          step={15}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="tabular pr-12"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center font-mono text-[9px] uppercase">
          min
        </span>
      </span>
    </label>
  );
}

export function FermentationPlanner({
  document,
}: {
  document: PizzaRecipeDocument;
}) {
  const plan = useCalculatorStore((state) => state.fermentationPlan);
  const setPlan = useCalculatorStore((state) => state.setFermentationPlan);
  const setOpen = useCalculatorStore(
    (state) => state.setFermentationWorkspaceOpen
  );
  const setStatusMessage = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );
  const [advanced, setAdvanced] = useState(false);
  const [keptOriginalTimezone, setKeptOriginalTimezone] = useState(false);
  const currentTimezone = getCurrentTimezone();
  const timezoneMismatch = plan && plan.timezone !== currentTimezone;

  const update = <Key extends keyof FermentationPlanInput>(
    key: Key,
    value: FermentationPlanInput[Key]
  ) => {
    if (plan) setPlan({ ...plan, [key]: value });
  };
  const timeline = useMemo(
    () =>
      plan?.enabled
        ? calculateFermentationTimeline(plan, document.calculatorInput)
        : null,
    [document.calculatorInput, plan]
  );

  const enable = () =>
    setPlan(
      createDefaultFermentationPlan(document.calculatorInput, document.context)
    );

  const start = async () => {
    const currentDocument = { ...document, fermentationPlan: plan };
    const result = await startBakingDaySession(currentDocument);
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    window.location.assign("/bake");
  };

  return (
    <section
      className="surface-workbench overflow-hidden"
      aria-labelledby="fermentation-heading"
      data-fermentation-planner
    >
      <div className="flex items-start justify-between gap-3 border-b-[0.5px] border-graphite px-5 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
            Execution planner
          </p>
          <h2 id="fermentation-heading" className="mt-1 text-base font-medium">
            Fermentation
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Schedule the formula you entered. Fermentation varies with dough,
            starter, yeast, temperatures, handling, and your actual equipment;
            this plan is guidance, not a precise prediction.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close fermentation workspace"
          onClick={() => setOpen(false)}
        >
          <XIcon />
        </Button>
      </div>

      {!plan?.enabled ? (
        <div className="grid place-items-start gap-3 p-5 sm:p-6">
          <p className="text-sm text-secondary-foreground">
            Plan forward from mix time or backward from bake time. Backward
            planning is the easiest starting point, and the first template is
            matched to this recipe style.
          </p>
          <Button onClick={enable} className="rounded-md">
            <CalendarClockIcon />
            Enable fermentation plan
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]">
          <div className="grid content-start gap-5 border-b-[0.5px] border-graphite p-5 sm:p-6 lg:border-r-[0.5px] lg:border-b-0">
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              Editable schedule template
              <select
                value={plan.templateId}
                className={fieldClass}
                onChange={(event) =>
                  setPlan(
                    applyFermentationTemplate(
                      event.target.value as FermentationPlanInput["templateId"],
                      plan,
                      document.calculatorInput
                    )
                  )
                }
              >
                {FERMENTATION_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="grid gap-3">
              <legend className="mb-2 font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
                Plan from
              </legend>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border-[0.5px] border-graphite bg-graphite">
                <button
                  type="button"
                  className={`min-h-11 bg-inset px-3 text-xs ${plan.direction === "backward-from-bake" ? "text-acid-lime" : "text-muted-foreground"}`}
                  aria-pressed={plan.direction === "backward-from-bake"}
                  onClick={() => update("direction", "backward-from-bake")}
                >
                  Desired bake time
                </button>
                <button
                  type="button"
                  className={`min-h-11 bg-inset px-3 text-xs ${plan.direction === "forward-from-mix" ? "text-acid-lime" : "text-muted-foreground"}`}
                  aria-pressed={plan.direction === "forward-from-mix"}
                  onClick={() => update("direction", "forward-from-mix")}
                >
                  Mix time
                </button>
              </div>
            </fieldset>

            <label className="grid gap-1.5 text-xs text-muted-foreground">
              {plan.direction === "backward-from-bake"
                ? "Desired bake date and time"
                : "Mix date and time"}
              <input
                type="datetime-local"
                value={plan.anchorLocalDateTime}
                onChange={(event) =>
                  update("anchorLocalDateTime", event.target.value)
                }
                className={fieldClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <DurationField
                label="Cold fermentation"
                value={plan.coldFermentMinutes}
                onChange={(value) => update("coldFermentMinutes", value)}
              />
              <DurationField
                label="Room fermentation"
                value={plan.roomBulkMinutes}
                onChange={(value) => update("roomBulkMinutes", value)}
              />
              <DurationField
                label="Warm-up"
                value={plan.warmUpMinutes}
                onChange={(value) => update("warmUpMinutes", value)}
              />
              <DurationField
                label="Final proof"
                value={plan.finalProofMinutes}
                onChange={(value) => update("finalProofMinutes", value)}
              />
            </div>

            <button
              type="button"
              className="flex min-h-10 items-center justify-between border-t-[0.5px] border-graphite pt-3 text-xs font-medium text-secondary-foreground"
              aria-expanded={advanced}
              onClick={() => setAdvanced((value) => !value)}
            >
              Advanced timing and temperatures
              <ChevronDownIcon
                className={`size-4 transition-transform ${advanced ? "rotate-180" : ""}`}
              />
            </button>

            {advanced ? (
              <div className="grid grid-cols-2 gap-3">
                <DurationField
                  label="Initial rest"
                  value={plan.initialRestMinutes}
                  onChange={(value) => update("initialRestMinutes", value)}
                />
                <DurationField
                  label="Fold interval"
                  value={plan.foldIntervalMinutes}
                  onChange={(value) => update("foldIntervalMinutes", value)}
                />
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Fold count
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={plan.foldCount}
                    onChange={(event) =>
                      update("foldCount", Number(event.target.value))
                    }
                  />
                </label>
                <DurationField
                  label="Preheat"
                  value={plan.preheatMinutes}
                  onChange={(value) => update("preheatMinutes", value)}
                />
                <DurationField
                  label="Divide and ball"
                  value={plan.divideBallMinutes}
                  onChange={(value) => update("divideBallMinutes", value)}
                />
                <DurationField
                  label="Pan dough"
                  value={plan.panMinutes}
                  onChange={(value) => update("panMinutes", value)}
                />
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Room temperature °F
                  <Input
                    type="number"
                    value={plan.roomTemperatureF ?? ""}
                    onChange={(event) =>
                      update(
                        "roomTemperatureF",
                        event.target.value
                          ? Number(event.target.value)
                          : undefined
                      )
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Refrigerator °F
                  <Input
                    type="number"
                    value={plan.refrigeratorTemperatureF ?? ""}
                    onChange={(event) =>
                      update(
                        "refrigeratorTemperatureF",
                        event.target.value
                          ? Number(event.target.value)
                          : undefined
                      )
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  Intended dough °F
                  <Input
                    type="number"
                    value={plan.intendedDoughTemperatureF ?? ""}
                    onChange={(event) =>
                      update(
                        "intendedDoughTemperatureF",
                        event.target.value
                          ? Number(event.target.value)
                          : undefined
                      )
                    }
                  />
                </label>
                <label className="col-span-2 flex min-h-10 items-center gap-2 text-xs text-secondary-foreground">
                  <input
                    type="checkbox"
                    checked={plan.includeLevainPrep}
                    onChange={(event) =>
                      update("includeLevainPrep", event.target.checked)
                    }
                    className="size-4 accent-acid-lime"
                  />
                  Include user-controlled levain or starter preparation
                </label>
                {plan.includeLevainPrep ? (
                  <DurationField
                    label="Levain preparation window"
                    value={plan.levainPrepMinutes}
                    onChange={(value) => update("levainPrepMinutes", value)}
                  />
                ) : null}
                <div className="col-span-2 grid gap-2 border-t-[0.5px] border-graphite pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
                      Custom stages
                    </span>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        update("customStages", [
                          ...plan.customStages,
                          {
                            id: `custom-${Date.now().toString(36)}`,
                            label: "Custom stage",
                            durationMinutes: 15,
                            activeWork: false,
                            position: "before-bake",
                          },
                        ])
                      }
                    >
                      Add stage
                    </Button>
                  </div>
                  {plan.customStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="grid grid-cols-[minmax(0,1fr)_5rem_auto] gap-2"
                    >
                      <Input
                        aria-label={`Custom stage ${index + 1} label`}
                        value={stage.label}
                        onChange={(event) =>
                          update(
                            "customStages",
                            plan.customStages.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, label: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <Input
                        aria-label={`Custom stage ${index + 1} duration in minutes`}
                        type="number"
                        min={0}
                        value={stage.durationMinutes}
                        onChange={(event) =>
                          update(
                            "customStages",
                            plan.customStages.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    durationMinutes: Number(event.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        aria-label={`Remove custom stage ${index + 1}`}
                        onClick={() =>
                          update(
                            "customStages",
                            plan.customStages.filter(
                              (_, itemIndex) => itemIndex !== index
                            )
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <label className="col-span-2 grid gap-1.5 text-xs text-muted-foreground">
                  Plan notes
                  <textarea
                    value={plan.notes ?? ""}
                    onChange={(event) => update("notes", event.target.value)}
                    className="min-h-20 resize-y rounded-md border-[0.5px] border-input bg-inset p-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                  />
                </label>
              </div>
            ) : null}

            <div className="surface-inset p-3 text-xs text-muted-foreground">
              <span className="font-mono text-[9px] tracking-[0.08em] uppercase">
                Timezone
              </span>
              <p className="mt-1 text-secondary-foreground">{plan.timezone}</p>
              {timezoneMismatch && !keptOriginalTimezone ? (
                <div className="mt-2 grid gap-2 border-t-[0.5px] border-graphite pt-2">
                  <p>
                    This schedule was created in {plan.timezone} and is being
                    viewed in another timezone.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setKeptOriginalTimezone(true)}
                    >
                      Keep original timezone reference
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => update("timezone", currentTimezone)}
                    >
                      Rebase to {currentTimezone}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid content-start gap-5 p-5 sm:p-6">
            {timeline?.ok ? (
              <>
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border-[0.5px] border-graphite bg-graphite">
                  <PlannerStat
                    label="Mix"
                    value={formatTimelineTimestamp(timeline.value.mixTimestamp)}
                  />
                  <PlannerStat
                    label="Bake"
                    value={formatTimelineTimestamp(
                      timeline.value.bakeTimestamp
                    )}
                  />
                  <PlannerStat
                    label="Elapsed"
                    value={formatTimelineDuration(
                      timeline.value.totalDurationMinutes
                    )}
                  />
                </div>
                {timeline.value.advisories.length > 0 ? (
                  <div className="surface-warning p-3 text-xs text-warning-foreground">
                    <p className="font-medium">Schedule advisories</p>
                    <ul className="mt-1 grid gap-1">
                      {timeline.value.advisories.map((advisory) => (
                        <li key={advisory.code}>— {advisory.message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <FermentationTimelineView stages={timeline.value.stages} />
                <Button
                  className="min-h-11 rounded-md bg-acid-lime text-void hover:bg-acid-lime/85"
                  onClick={() => void start()}
                >
                  <PlayIcon />
                  Start Baking Day
                </Button>
              </>
            ) : (
              <div className="surface-warning p-3 text-xs text-warning-foreground">
                {timeline?.errors.join(" ") ??
                  "Complete the plan to see its timeline."}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PlannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-inset p-2.5">
      <span className="font-mono text-[9px] text-muted-foreground uppercase">
        {label}
      </span>
      <p className="tabular mt-1 truncate text-[11px] text-secondary-foreground">
        {value}
      </p>
    </div>
  );
}
