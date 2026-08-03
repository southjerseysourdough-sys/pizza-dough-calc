import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { numberInput, recipeRegion } from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";

import { DoughCalculator } from "../components/dough-calculator";
import { useCalculatorStore } from "../store/calculator-store";

/**
 * Leavening modes and pan measurement.
 *
 * Leavening is chosen through a Base UI popup, whose open/close behaviour
 * depends on layout measurement jsdom does not perform. The mode is therefore
 * set through the same action the control calls, and every assertion is still
 * made against what the baker sees rendered.
 */
function chooseLeavening(method: "commercial-yeast" | "sourdough" | "hybrid") {
  useCalculatorStore.getState().setValues({ leaveningMethod: method });
}

beforeEach(resetCalculatorStore);

describe("commercial yeast mode", () => {
  it("shows yeast controls", () => {
    renderWithProviders(<DoughCalculator />);

    expect(numberInput(/^yeast$/i)).toBeInTheDocument();
  });

  it("hides starter-only controls", () => {
    renderWithProviders(<DoughCalculator />);

    expect(screen.queryByRole("spinbutton", { name: /^starter$/i })).toBeNull();
    expect(
      screen.queryByRole("spinbutton", { name: /starter hydration/i })
    ).toBeNull();
  });

  it("keeps the starter section out of the recipe", () => {
    renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).not.toHaveTextContent(/prefermented flour/i);
  });
});

describe("sourdough mode", () => {
  it("shows starter controls", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    expect(numberInput(/^starter$/i)).toBeInTheDocument();
  });

  it("hides the commercial yeast control", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    expect(screen.queryByRole("spinbutton", { name: /^yeast$/i })).toBeNull();
  });

  it("reports the starter breakdown in the recipe", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent(/total starter/i);
    expect(recipeRegion()).toHaveTextContent(/starter flour/i);
    expect(recipeRegion()).toHaveTextContent(/starter water/i);
    expect(recipeRegion()).toHaveTextContent(/prefermented flour/i);
  });

  it("leaves the requested hydration untouched", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    // The preset asks for 63%, and a starter must not shift that.
    expect(recipeRegion()).toHaveTextContent("63%");
  });

  it("shows starter hydration once advanced is open", () => {
    chooseLeavening("sourdough");
    useCalculatorStore.getState().setShowAdvanced(true);
    renderWithProviders(<DoughCalculator />);

    expect(numberInput(/starter hydration/i)).toBeInTheDocument();
  });
});

describe("hybrid mode", () => {
  it("shows both starter and yeast controls", () => {
    chooseLeavening("hybrid");
    renderWithProviders(<DoughCalculator />);

    expect(numberInput(/^starter$/i)).toBeInTheDocument();
    expect(numberInput(/^yeast$/i)).toBeInTheDocument();
  });

  it("includes both leaveners in the recipe", () => {
    chooseLeavening("hybrid");
    renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent(/total starter/i);
    expect(recipeRegion()).toHaveTextContent(/commercial yeast/i);
  });
});

describe("pan measurement confirmation", () => {
  async function goToSheetPan(
    user: ReturnType<typeof renderWithProviders>["user"]
  ) {
    await user.click(
      screen.getByRole("tab", { name: /sicilian or sheet pan/i })
    );
  }

  it("labels dimensions as nominal until measurement is confirmed", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    expect(numberInput(/interior length \(nominal\)/i)).toBeInTheDocument();
    expect(numberInput(/interior width \(nominal\)/i)).toBeInTheDocument();
  });

  it("shows the estimated-dimensions reminder", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    expect(screen.getByText(/estimated dimensions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/measure the flat inside baking surface/i)
    ).toBeInTheDocument();
  });

  it("relabels the dimensions as measured once confirmed", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    await user.click(
      screen.getByRole("switch", {
        name: /i measured the flat inside baking surface/i,
      })
    );

    expect(numberInput(/measured interior length/i)).toBeInTheDocument();
    expect(numberInput(/measured interior width/i)).toBeInTheDocument();
  });

  it("drops the estimated reminder once confirmed", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    await user.click(
      screen.getByRole("switch", {
        name: /i measured the flat inside baking surface/i,
      })
    );

    expect(screen.queryByText(/estimated dimensions/i)).toBeNull();
  });

  it("preserves the entered dimensions when confirming", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    const length = numberInput(/interior length/i);
    await user.clear(length);
    await user.type(length, "17.25");

    await user.click(
      screen.getByRole("switch", {
        name: /i measured the flat inside baking surface/i,
      })
    );

    // Confirming is a statement about the numbers, not a reason to replace them.
    expect(numberInput(/measured interior length/i)).toHaveValue(17.25);
  });

  it("keeps calculating while dimensions are only estimated", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    expect(screen.getByText(/estimated dimensions/i)).toBeInTheDocument();
    expect(recipeRegion()).toHaveTextContent(/kg|g/);
  });
});

describe("sheet pan dough loading advisories", () => {
  it("treats a heavy pan dough as a note rather than a warning", async () => {
    // Advanced holds the dough loading field, so open it before rendering.
    useCalculatorStore.getState().setShowAdvanced(true);
    const { user } = renderWithProviders(<DoughCalculator />);
    await user.click(
      screen.getByRole("tab", { name: /sicilian or sheet pan/i })
    );

    const loading = numberInput(/dough loading/i);
    await user.clear(loading);
    await user.type(loading, "7");

    const notes = within(recipeRegion())
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");

    expect(notes.some((text) => /note:/i.test(text))).toBe(true);
    expect(notes.some((text) => /heavy pan dough/i.test(text))).toBe(true);
  });
});
