import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  numberInput,
  openLedger,
  recipeRegion,
} from "@/test/calculator-queries";
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
  it("uses one clearly named yeast standard", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      screen.getByText(/recipe uses instant dry yeast/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/yeast type/i)).toBeNull();
  });

  it("keeps percentage tuning in more controls", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      screen.queryByRole("spinbutton", { name: /instant dry yeast/i })
    ).toBeNull();
  });

  it("hides starter-only controls", () => {
    renderWithProviders(<DoughCalculator />);

    expect(
      screen.queryByRole("spinbutton", { name: /starter amount/i })
    ).toBeNull();
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

    expect(numberInput(/starter amount/i)).toBeInTheDocument();
  });

  it("hides the commercial yeast control", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    expect(
      screen.queryByRole("spinbutton", { name: /instant dry yeast/i })
    ).toBeNull();
  });

  it("names the starter in the composition without opening anything", () => {
    chooseLeavening("sourdough");
    renderWithProviders(<DoughCalculator />);

    expect(recipeRegion()).toHaveTextContent(/sourdough starter/i);
  });

  it("reports the full starter breakdown in the ledger", async () => {
    chooseLeavening("sourdough");
    const { user } = renderWithProviders(<DoughCalculator />);
    await openLedger(user);

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
    useCalculatorStore.getState().setShowAdvanced(true);
    renderWithProviders(<DoughCalculator />);

    expect(numberInput(/starter amount/i)).toBeInTheDocument();
    expect(numberInput(/instant dry yeast/i)).toBeInTheDocument();
  });

  it("includes both leaveners in the recipe", async () => {
    chooseLeavening("hybrid");
    const { user } = renderWithProviders(<DoughCalculator />);

    // Both appear in the composition at a glance.
    expect(recipeRegion()).toHaveTextContent(/sourdough starter/i);
    expect(recipeRegion()).toHaveTextContent(/instant dry yeast/i);

    await openLedger(user);
    expect(recipeRegion()).toHaveTextContent(/total starter/i);
  });
});

describe("pan measurement confirmation", () => {
  async function goToSheetPan(
    user: ReturnType<typeof renderWithProviders>["user"]
  ) {
    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));
  }

  it("asks directly for the flat inside dimensions", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    expect(numberInput(/flat inside length/i)).toBeInTheDocument();
    expect(numberInput(/flat inside width/i)).toBeInTheDocument();
  });

  it("shows the estimated-dimensions reminder", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    expect(screen.getByText(/estimated dimensions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/measure the flat inside baking surface/i)
    ).toBeInTheDocument();
  });

  it("treats editing a dimension as measurement confirmation", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    const length = numberInput(/flat inside length/i);
    await user.clear(length);
    await user.type(length, "17.25");

    expect(length).toHaveValue(17.25);
    expect(useCalculatorStore.getState().panInteriorMeasured).toBe(true);
  });

  it("drops the estimated reminder after a dimension is edited", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await goToSheetPan(user);

    const width = numberInput(/flat inside width/i);
    await user.clear(width);
    await user.type(width, "12.5");

    expect(screen.queryByText(/estimated dimensions/i)).toBeNull();
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
    await user.click(screen.getByRole("radio", { name: /pan pizza/i }));

    const loading = numberInput(/dough loading/i);
    await user.clear(loading);
    await user.type(loading, "7");

    const notes = within(recipeRegion())
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");

    expect(notes.some((text) => /note/i.test(text))).toBe(true);
    expect(notes.some((text) => /heavy pan dough/i.test(text))).toBe(true);
  });
});
