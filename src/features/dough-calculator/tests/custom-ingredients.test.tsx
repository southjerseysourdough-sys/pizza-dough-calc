import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { recipeRegion } from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
  showAdvanced,
} from "@/test/render-calculator";

import { DoughCalculator } from "../components/dough-calculator";

function customPanel(): HTMLElement {
  return screen
    .getByRole("heading", { name: /custom ingredients/i, level: 2 })
    .closest("section") as HTMLElement;
}

function addIngredient(): HTMLElement {
  return within(customPanel()).getByRole("button", { name: /add ingredient/i });
}

beforeEach(() => {
  resetCalculatorStore();
  showAdvanced();
});

describe("adding custom ingredients", () => {
  it("starts empty", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      within(customPanel()).getByText(/no custom ingredients yet/i)
    ).toBeInTheDocument();
  });

  it("adds a row", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(addIngredient());

    expect(within(customPanel()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("will not stack up blank rows", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(addIngredient());

    // The button stays out of reach until the blank row is named.
    expect(addIngredient()).toBeDisabled();

    const name = within(customPanel()).getByRole("textbox");
    await user.type(name, "Milk Powder");

    expect(addIngredient()).toBeEnabled();
  });

  it("removes a row by its name", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(addIngredient());
    await user.type(within(customPanel()).getByRole("textbox"), "Milk Powder");

    await user.click(
      within(customPanel()).getByRole("button", { name: /remove milk powder/i })
    );

    expect(within(customPanel()).queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("custom ingredients in the recipe", () => {
  async function addMilkPowder(
    user: ReturnType<typeof renderWithProviders>["user"]
  ) {
    await user.click(addIngredient());
    await user.type(within(customPanel()).getByRole("textbox"), "Milk Powder");
    const percent = within(customPanel()).getAllByRole("spinbutton")[0];
    await user.clear(percent);
    await user.type(percent, "3");
  }

  it("appears in the live recipe summary", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).not.toHaveTextContent(/milk powder/i);

    await addMilkPowder(user);

    expect(recipeRegion()).toHaveTextContent(/milk powder/i);
    expect(recipeRegion()).toHaveTextContent("3%");
  });

  it("is included in the dough mass, so total flour drops", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // 334 g of flour before the addition.
    expect(recipeRegion()).toHaveTextContent("334 g");

    await addMilkPowder(user);

    // The dough weight is unchanged, so adding an ingredient must take its
    // share from the flour.
    expect(recipeRegion()).toHaveTextContent("563 g");
    expect(recipeRegion()).not.toHaveTextContent("334 g");
  });

  it("shows its calculated weight in the editor", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await addMilkPowder(user);

    // 3% of roughly 328 g of flour is about 10 g.
    expect(within(customPanel()).getByText("10 g")).toBeInTheDocument();
  });
});

describe("reserved ingredient names", () => {
  it("rejects a name the formula already tracks", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(addIngredient());
    await user.type(within(customPanel()).getByRole("textbox"), "Salt");

    expect(within(customPanel()).getByRole("alert")).toHaveTextContent(
      /already tracks salt separately/i
    );
  });

  it("allows a name that merely contains a reserved word", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(addIngredient());
    await user.type(within(customPanel()).getByRole("textbox"), "Poolish Salt");

    expect(within(customPanel()).queryByRole("alert")).toBeNull();
  });
});
