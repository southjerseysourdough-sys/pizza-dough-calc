import { calculateFermentationTimeline } from "../domain/fermentation";
import type { PizzaRecipeDocument } from "../domain/recipe-document";

export type StartBakingDayResult =
  { ok: true } | { ok: false; message: string };

export async function startBakingDaySession(
  document: PizzaRecipeDocument
): Promise<StartBakingDayResult> {
  if (!document.fermentationPlan?.enabled)
    return {
      ok: false,
      message:
        "Create and enable a fermentation plan before starting Baking Day.",
    };
  const timeline = calculateFermentationTimeline(
    document.fermentationPlan,
    document.calculatorInput
  );
  if (!timeline.ok) return { ok: false, message: timeline.errors[0] };
  const { createBakingSession, writeBakingSession } =
    await import("../domain/baking-session");
  const written = writeBakingSession(
    createBakingSession(document, timeline.value)
  );
  return written.ok ? { ok: true } : written;
}
