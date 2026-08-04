import { act, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCalculatorStore } from "@/features/dough-calculator/store/calculator-store";
import { useRecipeLibraryStore } from "@/features/dough-calculator/store/recipe-library-store";
import { makeRecipeDocument } from "@/features/dough-calculator/tests/recipe-fixtures";
import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";

import { ONBOARDING_STORAGE_KEY } from "../domain/onboarding";
import type { DeferredInstallPrompt } from "../domain/install";
import { InstallAppButton } from "../pwa/pwa-provider";
import { CommandPalette } from "../ui/command-palette";
import { DataManagementDialog } from "../ui/data-management-dialog";
import { HelpDialog } from "../ui/help-dialog";
import { OnboardingPanel } from "../ui/onboarding-panel";

beforeEach(() => {
  localStorage.clear();
  resetCalculatorStore();
  useRecipeLibraryStore.setState({
    collection: { schemaVersion: 2, recipes: [] },
    activeRecipeId: null,
    workingName: "Untitled recipe",
    statusMessage: null,
    hydrated: false,
  });
});

describe("launch interface", () => {
  it("supports Back and Skip and persists completion", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<OnboardingPanel onClose={onClose} />);
    expect(screen.getByText("Choose your format")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Enter size and quantity")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Choose your format")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("complete");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("finishes all five onboarding steps and focuses an explicit reopen", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <OnboardingPanel explicit onClose={onClose} />
    );
    expect(
      screen.getByRole("heading", { name: /choose your format/i })
    ).toHaveFocus();

    for (let step = 0; step < 4; step += 1)
      await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Keep or bake it")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /finish/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("navigates the help workspace and states the share-URL privacy boundary", async () => {
    const { user } = renderWithProviders(
      <HelpDialog open onOpenChange={vi.fn()} />
    );
    expect(
      screen.getByRole("heading", { name: /help center/i })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /privacy and local data/i })
    );
    expect(
      screen.getByText(/anyone with that url can read the recipe data/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /send feedback/i })).toBeNull();
  });

  it("runs a focused hydration command through the existing store", async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        document={makeRecipeDocument()}
      />
    );
    const search = screen.getByRole("combobox", { name: /search commands/i });
    await user.type(search, "set hydration");
    await user.click(
      await screen.findByRole("option", { name: /set hydration/i })
    );
    const hydration = screen.getByRole("spinbutton", { name: /hydration/i });
    await user.clear(hydration);
    await user.type(hydration, "71.5");
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(useCalculatorStore.getState().values.hydrationPercent).toBe(71.5);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("maps a format command to the existing calculator action", async () => {
    const { user } = renderWithProviders(
      <CommandPalette
        open
        onOpenChange={vi.fn()}
        document={makeRecipeDocument()}
      />
    );
    const search = screen.getByRole("combobox", { name: /search commands/i });
    await user.type(search, "sheet pan");
    await user.click(
      await screen.findByRole("option", {
        name: /switch to sicilian or sheet pan/i,
      })
    );
    expect(useCalculatorStore.getState().formatMode).toBe("sheet-pan");
  });

  it("exposes install only after the browser offers it and handles cancellation", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as DeferredInstallPrompt;
    Object.defineProperties(event, {
      prompt: { value: prompt },
      userChoice: {
        value: Promise.resolve({ outcome: "dismissed" as const }),
      },
    });
    const { user } = renderWithProviders(<InstallAppButton />);

    act(() => window.dispatchEvent(event));
    const button = await screen.findByRole("button", { name: /install app/i });
    await user.click(button);
    expect(prompt).toHaveBeenCalledOnce();
    expect(await screen.findByRole("status")).toHaveTextContent(
      /installation was canceled/i
    );
  });

  it("announces offline state without blocking the current workspace", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    renderWithProviders(<p>Current recipe remains visible</p>);
    expect(screen.getByRole("status")).toHaveTextContent(
      /offline · local work stays available/i
    );
    expect(screen.getByText(/current recipe remains visible/i)).toBeVisible();
  });

  it("confirms a draft reset separately from saved data", async () => {
    useCalculatorStore.getState().setValues({ hydrationPercent: 77 });
    const { user } = renderWithProviders(
      <DataManagementDialog open onOpenChange={vi.fn()} />
    );
    await user.click(
      screen.getByRole("button", { name: /reset active draft/i })
    );
    const confirmation = screen.getByRole("alertdialog");
    expect(confirmation).toHaveTextContent(
      /saved recipes and baking day stay unchanged/i
    );
    await user.click(
      within(confirmation).getByRole("button", { name: /^confirm$/i })
    );
    await waitFor(() =>
      expect(useCalculatorStore.getState().values.hydrationPercent).toBe(63)
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /only the active draft was reset/i
    );
  });
});
