import { BAKING_STEEL_PLUS } from "../presets/equipment";

/**
 * How the numbers were reached.
 *
 * Server rendered: it is static prose and needs no interactivity. Everything
 * stated here is arithmetic the engine actually performs — no fermentation
 * predictions and no claims we cannot support.
 */
export function FormulaExplanation() {
  return (
    <section
      aria-labelledby="how-it-works"
      className="flex flex-col gap-4 text-sm text-muted-foreground"
    >
      <h2
        id="how-it-works"
        className="font-heading text-base font-semibold text-foreground"
      >
        How these numbers are worked out
      </h2>

      <div className="flex flex-col gap-3">
        <p>
          <span className="font-medium text-foreground">Dough weight.</span>{" "}
          Baking area is multiplied by a dough loading in grams per square inch,
          then by the number of pizzas. Round area is π × radius², and pan area
          is the measured interior length × width. Sizing by area rather than by
          diameter keeps a style consistent as sizes change.
        </p>

        <p>
          <span className="font-medium text-foreground">
            Baker&rsquo;s percentages.
          </span>{" "}
          Every ingredient is expressed against total flour. Total flour is
          solved once, by dividing the target dough weight by the sum of all
          percentages plus 1 for the flour itself, then every ingredient is
          derived from that single figure. Nothing is calculated from an
          already-rounded number.
        </p>

        <p>
          <span className="font-medium text-foreground">
            Sourdough starter.
          </span>{" "}
          A starter&rsquo;s flour and water are already part of the formula
          totals, so they are subtracted from what you weigh out rather than
          added on top. This is why the final hydration stays exactly where you
          set it no matter how much starter you use.
        </p>

        <p>
          <span className="font-medium text-foreground">Equipment.</span>{" "}
          Surface and pan dimensions are used only for fit guidance. Choosing
          the {BAKING_STEEL_PLUS.name} — {BAKING_STEEL_PLUS.widthInches}″ ×{" "}
          {BAKING_STEEL_PLUS.depthInches}″ — never changes hydration, salt,
          yeast or dough weight.
        </p>

        <p>
          <span className="font-medium text-foreground">Rounding.</span> Full
          precision is kept throughout and rounded only for display, so the
          weights shown always sum back to the dough weight.
        </p>

        <p className="rounded-lg bg-muted/50 px-3 py-2.5">
          Yeast and starter percentages are starting points, not guarantees.
          Fermentation depends on time and temperature, which this release does
          not model. Treat the leavening figure as a place to begin and adjust
          it to your kitchen.
        </p>
      </div>
    </section>
  );
}
