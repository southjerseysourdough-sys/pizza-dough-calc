import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { recipeRegion } from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";
import { setMediaQuery } from "@/test/setup";

import { DoughCalculator } from "../components/dough-calculator";
import { toVisualState } from "../components/dough-stage";
import { calculateDough } from "../domain/calculate-dough";
import { NEW_YORK_ON_STEEL, SICILIAN_SHEET_PAN } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";
import { toDoughFormulaInput } from "../schemas/calculator-schema";

/**
 * The live dough stage and its technical Dough Field.
 * jsdom does not inspect visual pixels; these tests cover the data contract,
 * accessible description, and the SVG path used on every device.
 */

// The store is a module singleton, so without this a shape or quantity set by
// one test leaks into the next.
beforeEach(resetCalculatorStore);

function resultFor(preset: typeof NEW_YORK_ON_STEEL) {
  const calculation = calculateDough(
    toDoughFormulaInput(presetToFormValues(preset))
  );
  if (!calculation.ok) throw new Error("expected a valid preset");
  return calculation.result;
}

describe("visualizer state for round mode", () => {
  it("receives the diameter, hydration and dough weight", () => {
    const values = presetToFormValues(NEW_YORK_ON_STEEL);
    const state = toVisualState(values, resultFor(NEW_YORK_ON_STEEL));

    expect(state.shape).toBe("round");
    expect(state.diameterInches).toBe(16);
    expect(state.hydrationPercent).toBe(63);
    expect(state.totalDoughWeightGrams).toBeCloseTo(562.9734, 3);
    expect(state.quantity).toBe(1);
  });

  it("tracks the diameter as it changes", () => {
    const values = presetToFormValues(NEW_YORK_ON_STEEL);
    const state = toVisualState({ ...values, diameterInches: 12 }, null);

    expect(state.diameterInches).toBe(12);
  });
});

describe("visualizer state for rectangular mode", () => {
  it("receives the pan dimensions and dough weight", () => {
    const values = presetToFormValues(SICILIAN_SHEET_PAN);
    const state = toVisualState(values, resultFor(SICILIAN_SHEET_PAN));

    expect(state.shape).toBe("rectangular");
    expect(state.interiorLengthInches).toBe(18);
    expect(state.interiorWidthInches).toBe(13);
    expect(state.hydrationPercent).toBe(70);
    expect(state.totalDoughWeightGrams).toBeCloseTo(1053, 0);
  });

  it("keeps the entered dimensions in the field contract", () => {
    const values = presetToFormValues(SICILIAN_SHEET_PAN);
    const state = toVisualState(
      { ...values, usableInteriorWidthInches: 0 },
      null
    );

    expect(state.interiorLengthInches).toBe(18);
    expect(state.interiorWidthInches).toBe(0);
  });
});

describe("SVG Dough Field", () => {
  it("renders without WebGL", () => {
    const { container } = renderWithProviders(<DoughCalculator />);

    expect(container.querySelector("[data-dough-field]")).not.toBeNull();
    expect(container.querySelector("[data-dough-field] svg")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("reflects the current shape", async () => {
    const { container, user } = renderWithProviders(<DoughCalculator />);

    expect(
      container.querySelector("[data-dough-field='round']")
    ).not.toBeNull();

    await user.click(
      screen.getByRole("radio", { name: /sicilian or sheet pan/i })
    );

    expect(
      container.querySelector("[data-dough-field='rectangular']")
    ).not.toBeNull();
  });

  it("keeps every calculator value available beside the field", () => {
    const { container } = renderWithProviders(<DoughCalculator />);

    expect(container.querySelector("canvas")).toBeNull();
    expect(recipeRegion()).toHaveTextContent("563 g");
    expect(recipeRegion()).toHaveTextContent(/flour/i);
    expect(
      screen.getByRole("spinbutton", { name: /pizza diameter/i })
    ).toBeInTheDocument();
  });

  it("still renders the full SVG under reduced motion", () => {
    setMediaQuery("(prefers-reduced-motion: reduce)");
    const { container } = renderWithProviders(<DoughCalculator />);

    expect(container.querySelector("[data-dough-field]")).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("exposes every responsive input on the field", () => {
    const { container } = renderWithProviders(<DoughCalculator />);
    const field = container.querySelector("[data-dough-field]");

    expect(field).toHaveAttribute("data-diameter", "16");
    expect(field).toHaveAttribute("data-hydration", "63");
    expect(field).toHaveAttribute("data-loading", "2.8");
    expect(field).toHaveAttribute("data-quantity", "1");
    expect(field).toHaveAttribute("data-total");
  });
});

describe("the headline result", () => {
  it("shows the total dough weight prominently on the stage", () => {
    renderWithProviders(<DoughCalculator />);

    const stage = screen.getByRole("region", { name: /dough lab/i });
    // Responsive stage variants are mutually exclusive in CSS: the compact
    // result is used below lg and the measurement column at lg and above.
    expect(within(stage).getAllByText(/total dough/i)).toHaveLength(2);
    expect(stage).toHaveTextContent("563 g");
  });

  it("leads the recipe with the total, before any detail", () => {
    renderWithProviders(<DoughCalculator />);

    const text = recipeRegion().textContent ?? "";
    // The headline weight appears before the ledger disclosure.
    expect(text.indexOf("563 g")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("563 g")).toBeLessThan(
      text.indexOf("Full ingredient ledger")
    );
  });

  it("states the size, hydration and style alongside the weight", () => {
    renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent("1 pizza");
    expect(recipeRegion()).toHaveTextContent("63% hydration");
    expect(recipeRegion()).toHaveTextContent(/new york on baking steel plus/i);
  });

  it("does not render a fixed duplicate mobile result bar", () => {
    const { container } = renderWithProviders(<DoughCalculator />);

    expect(container.querySelector("[data-mobile-summary-bar]")).toBeNull();
    expect(container.querySelector(".fixed")).toBeNull();
  });
});

describe("ingredient composition", () => {
  it("labels every segment with its exact weight", () => {
    renderWithProviders(<DoughCalculator />);

    const composition = within(recipeRegion()).getByRole("list", {
      name: /ingredient composition/i,
    });

    // Text labels and gram values, not colour alone.
    expect(within(composition).getByText("Flour")).toBeInTheDocument();
    expect(within(composition).getByText("Water")).toBeInTheDocument();
    expect(within(composition).getByText("Salt")).toBeInTheDocument();
    expect(composition).toHaveTextContent("334 g");
    expect(composition).toHaveTextContent("210 g");
  });

  it("keeps the bar itself out of the accessibility tree", () => {
    const { container } = renderWithProviders(<DoughCalculator />);

    // The drawn bar duplicates the list beneath it, so it is hidden rather
    // than read out twice.
    const bar = container.querySelector("[aria-hidden='true'].surface-inset");
    expect(bar).not.toBeNull();
  });
});

describe("format cards", () => {
  it("are a keyboard reachable radio group", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const round = screen.getByRole("radio", { name: /round on steel/i });
    const sheet = screen.getByRole("radio", { name: /sicilian or sheet pan/i });

    expect(round).toBeChecked();

    sheet.focus();
    await user.keyboard("{ }");

    expect(sheet).toBeChecked();
    expect(round).not.toBeChecked();
  });

  it("names the group", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      screen.getByRole("group", { name: /pizza format/i })
    ).toBeInTheDocument();
  });
});

describe("advanced mode", () => {
  beforeEach(resetCalculatorStore);

  it("reveals the toolbox sections", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(
      screen.queryByRole("heading", { name: /main dough flour blend/i })
    ).toBeNull();

    await user.click(screen.getByRole("switch", { name: /advanced/i }));

    expect(
      screen.getByRole("heading", { name: /main dough flour blend/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /custom ingredients/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /dough loading/i })
    ).toBeInTheDocument();
  });
});

describe("recipe details and warnings", () => {
  it("keeps the full ledger reachable", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const toggle = screen.getByRole("button", {
      name: /full ingredient ledger/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(recipeRegion()).toHaveTextContent(/total formula flour/i);
    expect(recipeRegion()).toHaveTextContent(/true hydration/i);
  });

  it("presents advisories with a heading and explanation, not just colour", () => {
    renderWithProviders(<DoughCalculator />);

    const advisory = screen
      .getAllByRole("listitem")
      .find((item) => /worth knowing/i.test(item.textContent ?? ""));

    expect(advisory).toBeDefined();
    expect(advisory).toHaveTextContent(/worth knowing/i);
    expect(advisory).toHaveTextContent(/wider than the 15" short side/i);
  });
});
