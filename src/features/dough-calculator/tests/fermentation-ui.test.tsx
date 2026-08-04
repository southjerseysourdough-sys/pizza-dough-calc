import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";
import { BakingDay } from "../components/baking-day";
import { DoughCalculator } from "../components/dough-calculator";
import {
  createBakingSession,
  readBakingSession,
  writeBakingSession,
} from "../domain/baking-session";
import {
  calculateFermentationTimeline,
  createDefaultFermentationPlan,
} from "../domain/fermentation";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { emptyRecipeCollection } from "../utils/recipe-storage";
import { makeRecipeDocument } from "./recipe-fixtures";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  resetCalculatorStore();
  useRecipeLibraryStore.setState({
    collection: emptyRecipeCollection(),
    activeRecipeId: null,
    hydrated: true,
    storageMessage: null,
    workingName: null,
    statusMessage: null,
    invalidShare: false,
  });
});

describe("fermentation planner behavior", () => {
  it("enables a plan, switches direction, updates time, and shows a timeline", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await user.click(
      screen.getByRole("button", { name: /open fermentation planner/i })
    );
    await user.click(
      await screen.findByRole("button", { name: /enable fermentation plan/i })
    );
    expect(
      screen.getAllByText(/America\/|Local timezone|UTC/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /desired bake time/i })
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /^mix time$/i }));
    expect(screen.getByRole("button", { name: /^mix time$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const anchor = screen.getByLabelText(/mix date and time/i);
    fireEvent.change(anchor, { target: { value: "2026-08-08T09:30" } });
    expect(anchor).toHaveValue("2026-08-08T09:30");
    expect(screen.getAllByText(/weigh ingredients/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /start baking day/i })
    ).toBeEnabled();
  });

  it("changes the generated schedule when cold fermentation changes", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    await user.click(
      screen.getByRole("button", { name: /open fermentation planner/i })
    );
    await user.click(
      await screen.findByRole("button", { name: /enable fermentation plan/i })
    );
    const cold = screen.getByLabelText(/cold fermentation/i);
    await user.clear(cold);
    await user.type(cold, "0");
    expect(screen.queryByText(/^Cold ferment$/i)).not.toBeInTheDocument();
  });
});

describe("Baking Day behavior", () => {
  function seedSession() {
    const base = makeRecipeDocument("Kitchen test");
    const plan = {
      ...createDefaultFermentationPlan(
        base.calculatorInput,
        base.context,
        new Date()
      ),
      anchorLocalDateTime: "2026-08-09T18:00",
    };
    const document = { ...base, fermentationPlan: plan };
    const timeline = calculateFermentationTimeline(
      plan,
      document.calculatorInput,
      0
    );
    if (!timeline.ok) throw new Error(timeline.errors[0]);
    writeBakingSession(createBakingSession(document, timeline.value));
  }

  it("renders the current task and persists timer start and pause", async () => {
    seedSession();
    const { user } = renderWithProviders(<BakingDay />);
    expect(await screen.findByText("Kitchen test")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /weigh ingredients/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start timer/i }));
    await waitFor(() => {
      const stored = readBakingSession();
      expect(stored.ok && stored.value?.timer?.status).toBe("running");
    });
    await user.click(screen.getByRole("button", { name: /^pause$/i }));
    await waitFor(() => {
      const stored = readBakingSession();
      expect(stored.ok && stored.value?.timer?.status).toBe("paused");
    });
    expect(
      screen.getByRole("button", { name: /^resume$/i })
    ).toBeInTheDocument();
  });

  it("handles unsupported wake lock and notifications without blocking", async () => {
    seedSession();
    const { user } = renderWithProviders(<BakingDay />);
    await screen.findByText("Kitchen test");
    await user.click(
      screen.getByRole("button", { name: /keep screen awake/i })
    );
    expect(screen.getByText(/Wake Lock is not supported/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /enable timer notifications/i })
    );
    expect(
      screen.getByText(/notifications are not supported/i)
    ).toBeInTheDocument();
  });

  it("asks whether to shift or preserve planned times on completion", async () => {
    seedSession();
    const { user } = renderWithProviders(<BakingDay />);
    await screen.findByText("Kitchen test");
    await user.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(
      screen.getByRole("heading", { name: /update the remaining schedule/i })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /keep original schedule/i })
    );
    expect(
      screen.getByRole("heading", { name: /mix dough/i })
    ).toBeInTheDocument();
  });
});
