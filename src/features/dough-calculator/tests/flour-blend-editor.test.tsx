import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { openLedger, recipeRegion } from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
  showAdvanced,
} from "@/test/render-calculator";

import { DoughCalculator } from "../components/dough-calculator";

/**
 * Main Dough Flour Blend editor behaviour.
 *
 * The blend lives behind the advanced toggle, so each test opens that first.
 */

/**
 * The editor panel, not the identically named section in the recipe summary.
 * The editor's title is a level 2 heading; the summary's is level 3.
 */
function blendPanel(): HTMLElement {
  return screen
    .getByRole("heading", { name: /main dough flour blend/i, level: 2 })
    .closest("section") as HTMLElement;
}

/** The "Blend total" row, so its percentage can be read unambiguously. */
function blendTotalRow(): HTMLElement {
  return within(blendPanel()).getByText("Blend total")
    .parentElement as HTMLElement;
}

function blendRows(): HTMLElement[] {
  return within(blendPanel()).getAllByRole("listitem");
}

beforeEach(() => {
  resetCalculatorStore();
  showAdvanced();
});

describe("adding and removing flours", () => {
  it("starts with the preset's single flour", () => {
    renderWithProviders(<DoughCalculator />);

    expect(blendRows()).toHaveLength(1);
    expect(
      within(blendPanel()).getByDisplayValue("Bread flour")
    ).toBeInTheDocument();
  });

  it("adds a row", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );

    expect(blendRows()).toHaveLength(2);
  });

  it("removes a row by its name", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );
    expect(blendRows()).toHaveLength(2);

    // The remove action names the flour it belongs to.
    await user.click(
      within(blendPanel()).getByRole("button", { name: /remove bread flour/i })
    );

    expect(blendRows()).toHaveLength(1);
  });

  it("never lets the last row be removed", () => {
    renderWithProviders(<DoughCalculator />);

    expect(blendRows()).toHaveLength(1);
    expect(
      within(blendPanel()).getByRole("button", { name: /remove bread flour/i })
    ).toBeDisabled();
  });
});

describe("blend validation", () => {
  it("accepts a blend totalling 100 percent", () => {
    renderWithProviders(<DoughCalculator />);

    expect(blendTotalRow()).toHaveTextContent("100%");
    expect(within(blendPanel()).queryByRole("alert")).toBeNull();
  });

  it("flags a blend that does not total 100 percent", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    // A second row at 0% leaves the blend at 100, so drop the first to 60.
    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );
    const shares = within(blendPanel()).getAllByRole("spinbutton");
    await user.clear(shares[0]);
    await user.type(shares[0], "60");

    const alert = within(blendPanel()).getByRole("alert");
    expect(alert).toHaveTextContent(/must total 100%/i);
    expect(alert).toHaveTextContent(/60/);
  });

  it("blocks the recipe while the blend is out of balance", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );
    const shares = within(blendPanel()).getAllByRole("spinbutton");
    await user.clear(shares[0]);
    await user.type(shares[0], "60");

    // The summary is replaced by the list of things to fix.
    expect(screen.queryByRole("region", { name: /your recipe/i })).toBeNull();
    expect(
      screen.getByRole("heading", { name: /check these values/i })
    ).toBeInTheDocument();
  });
});

describe("normalizing", () => {
  it("scales rows proportionally back to 100 percent", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );

    const shares = () => within(blendPanel()).getAllByRole("spinbutton");
    await user.clear(shares()[0]);
    await user.type(shares()[0], "30");
    await user.clear(shares()[1]);
    await user.type(shares()[1], "10");

    await user.click(
      within(blendPanel()).getByRole("button", { name: /normalize to 100%/i })
    );

    // 30:10 keeps its 3:1 ratio, becoming 75 and 25 rather than 50/50.
    expect(shares()[0]).toHaveValue(75);
    expect(shares()[1]).toHaveValue(25);
    expect(blendTotalRow()).toHaveTextContent("100%");
  });

  it("is offered only when the blend is out of balance", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    const normalize = () =>
      within(blendPanel()).getByRole("button", { name: /normalize to 100%/i });

    expect(normalize()).toBeDisabled();

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );
    const shares = within(blendPanel()).getAllByRole("spinbutton");
    await user.clear(shares[0]);
    await user.type(shares[0], "40");

    expect(normalize()).toBeEnabled();
  });
});

describe("blend weights", () => {
  it("splits the added flour across the rows in the recipe", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);

    await user.click(
      within(blendPanel()).getByRole("button", { name: /add flour/i })
    );

    // The flour name field offers suggestions via <datalist>, which gives the
    // input an implicit combobox role rather than textbox.
    const names = within(blendPanel()).getAllByRole("combobox");
    await user.clear(names[0]);
    await user.type(names[0], "Bread Flour");
    await user.type(names[1], "Semolina");

    const shares = within(blendPanel()).getAllByRole("spinbutton");
    await user.clear(shares[0]);
    await user.type(shares[0], "80");
    await user.clear(shares[1]);
    await user.type(shares[1], "20");

    // The per-flour split lives in the ledger alongside the other exact
    // figures, so open it. 334 g of added flour splits 267 / 67.
    await openLedger(user);
    expect(recipeRegion()).toHaveTextContent(/semolina/i);
    expect(recipeRegion()).toHaveTextContent("267 g");
    expect(recipeRegion()).toHaveTextContent("67 g");
  });

  it("reports the flour accounting breakdown", () => {
    renderWithProviders(<DoughCalculator />);

    const panel = blendPanel();
    expect(within(panel).getByText(/total formula flour/i)).toBeInTheDocument();
    expect(within(panel).getByText(/flour in starter/i)).toBeInTheDocument();
    expect(within(panel).getByText(/added flour/i)).toBeInTheDocument();
    expect(
      within(panel).getByText(/main dough blend total/i)
    ).toBeInTheDocument();
  });

  it("explains that starter flour is excluded", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      within(blendPanel()).getByText(
        /this blend applies to the flour added during mixing/i
      )
    ).toBeInTheDocument();
  });
});
