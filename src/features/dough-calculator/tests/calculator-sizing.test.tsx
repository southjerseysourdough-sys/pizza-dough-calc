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

    expect(screen.getByRole("radio", { name: /16/ })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    expect(screen.queryByRole("radio", { name: /^16/ })).toBeNull();
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

    expect(screen.getByRole("radio", { name: /16/ })).toBeChecked();
  });

  it("adopts a dough style built for the new format", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    // A round pie's 2.39 g/in² in a sheet pan is a cracker, so the format
    // switch has to land on a pan formula rather than carry the old one over.
    expect(screen.getByRole("radio", { name: /^sicilian$/i })).toBeChecked();
    expect(recipeRegion()).toHaveTextContent(/sicilian/i);
  });

  it("keeps the batch size across a format switch", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const quantity = numberInput(/number of pizzas/i);
    await user.clear(quantity);
    await user.type(quantity, "4");

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    // How many you are making is about you, not about the dough.
    expect(numberInput(/number of pans/i)).toHaveValue(4);
  });
});

describe("pan sizes", () => {
  beforeEach(resetCalculatorStore);

  it("offers a cookie sheet and applies its dimensions", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));
    await user.click(screen.getByRole("radio", { name: /cookie sheet, 12/i }));

    expect(numberInput(/flat inside length/i)).toHaveValue(15);
    expect(numberInput(/flat inside width/i)).toHaveValue(12);
  });
});

describe("pizza size", () => {
  beforeEach(resetCalculatorStore);

  it("opens on the standard 16 inch, 480 g dough ball", () => {
    renderWithProviders(<DoughCalculator />);

    expect(screen.getByRole("radio", { name: /16/ })).toBeChecked();
    expect(recipeRegion()).toHaveTextContent("480 g");
  });

  it("changes the recipe when a different standard size is chosen", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(screen.getByRole("radio", { name: /12/ }));

    // The same dough loading over a 12" area is 270 g. Asserted on the
    // per-pizza line rather than the headline, which is mid-animation.
    expect(recipeRegion()).toHaveTextContent("270 g each");
    expect(recipeRegion()).not.toHaveTextContent("480 g each");
  });

  it("keeps the crust thickness constant across the size ladder", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // A 9" personal pizza is the same crust, scaled by area alone.
    await user.click(screen.getByRole("radio", { name: /9/ }));

    expect(recipeRegion()).toHaveTextContent("152 g each");
  });

  it("reveals a diameter field when Custom is chosen", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(
      screen.queryByRole("spinbutton", { name: /pizza diameter/i })
    ).toBeNull();

    await user.click(screen.getByRole("radio", { name: /custom, any size/i }));

    const diameter = numberInput(/pizza diameter/i);
    await user.clear(diameter);
    await user.type(diameter, "13");

    // 2.387 g/in² x (pi x 6.5²) in² = 317 g.
    expect(recipeRegion()).toHaveTextContent("317 g each");
  });

  it("updates the flour weight alongside the dough weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // 480 / 1.687 = 285 g of flour.
    expect(recipeRegion()).toHaveTextContent("285 g");

    await user.click(screen.getByRole("radio", { name: /12/ }));

    // 270 / 1.687 = 160 g of flour.
    expect(recipeRegion()).toHaveTextContent("160 g");
  });
});

describe("quantity", () => {
  beforeEach(resetCalculatorStore);

  it("multiplies the total dough weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent("480 g");

    const quantity = numberInput(/number of pizzas/i);
    await user.clear(quantity);
    await user.type(quantity, "3");

    // Three 16" pizzas is 1.44 kg, shown in kilograms once past 1000 g.
    expect(recipeRegion()).toHaveTextContent("1.44 kg");
    expect(recipeRegion()).toHaveTextContent(/3 pizzas/i);
  });

  it("leaves the per-pizza weight unchanged", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const quantity = numberInput(/number of pizzas/i);
    await user.clear(quantity);
    await user.type(quantity, "4");

    // Each pizza is still 480 g; only the batch total grows.
    expect(recipeRegion()).toHaveTextContent("480 g");
    expect(recipeRegion()).toHaveTextContent("1.92 kg");
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

    await user.click(screen.getByRole("radio", { name: /custom, any size/i }));
    const diameter = numberInput(/pizza diameter/i);
    await user.clear(diameter);
    await user.type(diameter, "15");

    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(false);
  });

  it("keeps calculating normally while the warning is shown", () => {
    renderWithProviders(<DoughCalculator />);

    // Guidance only: the 16" recipe is still produced in full.
    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("480 g");
  });
});

describe("hydration", () => {
  beforeEach(resetCalculatorStore);

  it("changes the water weight", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // 63% of 285 g of flour is 179 g of water.
    expect(recipeRegion()).toHaveTextContent("179 g");

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "70");

    // Raising hydration lowers flour and raises water for the same dough.
    expect(recipeRegion()).toHaveTextContent("70%");
    expect(recipeRegion()).not.toHaveTextContent("179 g");
  });

  it("warns below 50 percent but still calculates", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "45");

    expect(hasIssueMatching(/quite low/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("480 g");
  });

  it("warns above 90 percent but still calculates", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const hydration = numberInput(/^hydration$/i);
    await user.clear(hydration);
    await user.type(hydration, "95");

    expect(hasIssueMatching(/very high/i)).toBe(true);
    expect(recipeRegion()).toHaveTextContent("480 g");
  });
});
