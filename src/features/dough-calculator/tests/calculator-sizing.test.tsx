import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  hasIssueMatching,
  numberInput,
  recipeRegion,
} from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";

import { DoughCalculator } from "../components/dough-calculator";

/**
 * Size, quantity and equipment behaviour, tested the way a baker experiences
 * it: type into a field, read the recipe.
 */

describe("format switching", () => {
  beforeEach(resetCalculatorStore);

  it("moves from round controls to sheet pan controls", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(numberInput(/pizza diameter/i)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    expect(
      screen.queryByRole("spinbutton", { name: /pizza diameter/i })
    ).toBeNull();
    expect(numberInput(/flat inside length/i)).toBeInTheDocument();
    expect(numberInput(/flat inside width/i)).toBeInTheDocument();
  });

  it("switches the recipe from counting pizzas to counting pans", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent(/1 pizza/i);

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    expect(recipeRegion()).toHaveTextContent(/1 pan/i);
  });

  it("returns to round controls", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));
    await user.click(screen.getByRole("radio", { name: /round pizza/i }));

    expect(numberInput(/pizza diameter/i)).toBeInTheDocument();
  });
});

describe("pizza diameter", () => {
  beforeEach(resetCalculatorStore);

  it("changes the recipe when the diameter changes", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // 16" at 2.80 g/in² is 563 g.
    expect(recipeRegion()).toHaveTextContent("563 g");

    const diameter = numberInput(/pizza diameter/i);
    await user.clear(diameter);
    await user.type(diameter, "12");

    // 12" at the same loading is 2.80 x pi x 36 = 317 g.
    expect(recipeRegion()).toHaveTextContent("317 g");
    expect(recipeRegion()).not.toHaveTextContent("563 g");
  });

  it("updates the flour weight alongside the dough weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent("334 g");

    const diameter = numberInput(/pizza diameter/i);
    await user.clear(diameter);
    await user.type(diameter, "12");

    // 317 / 1.687 = 188 g of flour.
    expect(recipeRegion()).toHaveTextContent("188 g");
  });
});

describe("quantity", () => {
  beforeEach(resetCalculatorStore);

  it("multiplies the total dough weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent("563 g");

    const quantity = numberInput(/number of pizzas/i);
    await user.clear(quantity);
    await user.type(quantity, "3");

    // Three 16" pizzas is 1.69 kg, shown in kilograms once past 1000 g.
    expect(recipeRegion()).toHaveTextContent("1.69 kg");
    expect(recipeRegion()).toHaveTextContent(/3 pizzas/i);
  });

  it("leaves the per-pizza weight unchanged", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const quantity = numberInput(/number of pizzas/i);
    await user.clear(quantity);
    await user.type(quantity, "4");

    // Each pizza is still 563 g; only the batch total grows.
    expect(recipeRegion()).toHaveTextContent("563 g");
    expect(recipeRegion()).toHaveTextContent("2.25 kg");
  });
});

describe("Baking Steel Plus fit guidance", () => {
  beforeEach(resetCalculatorStore);

  it("warns that a 16 inch pizza overhangs the 15 inch side", () => {
    renderWithProviders(<DoughCalculator />);

    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(true);
  });

  it("drops the warning at 15 inches", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(true);

    const diameter = numberInput(/pizza diameter/i);
    await user.clear(diameter);
    await user.type(diameter, "15");

    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(false);
  });

  it("keeps calculating normally while the warning is shown", () => {
    renderWithProviders(<DoughCalculator />);

    // Guidance only: the 16" recipe is still produced in full.
    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("563 g");
  });
});

describe("hydration", () => {
  beforeEach(resetCalculatorStore);

  it("changes the water weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // 63% of 334 g of flour is 210 g of water.
    expect(recipeRegion()).toHaveTextContent("210 g");

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "70");

    // Raising hydration lowers flour and raises water for the same dough.
    expect(recipeRegion()).toHaveTextContent("70%");
    expect(recipeRegion()).not.toHaveTextContent("210 g");
  });

  it("warns below 50 percent but still calculates", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "45");

    expect(hasIssueMatching(/quite low/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("563 g");
  });

  it("warns above 90 percent but still calculates", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "95");

    expect(hasIssueMatching(/very high/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("563 g");
  });
});
