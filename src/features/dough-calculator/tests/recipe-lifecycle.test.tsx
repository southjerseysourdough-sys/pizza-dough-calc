import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";
import { RecipeActions } from "../components/recipe-actions";
import { FormulaSignature } from "../components/formula-signature";
import { RecipeStatus } from "../components/recipe-status";
import { DoughCalculator } from "../components/dough-calculator";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { emptyRecipeCollection, saveNewRecipe } from "../utils/recipe-storage";
import { serializeRecipeDocument } from "../utils/recipe-format";
import { makeRecipeDocument } from "./recipe-fixtures";
import { createFormulaSignatureData } from "../domain/formula-signature";

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

async function openActions(
  user: ReturnType<typeof renderWithProviders>["user"]
) {
  await user.click(screen.getByRole("button", { name: /recipe actions/i }));
  await screen.findByRole("menu");
}

describe("recipe actions and saved recipes", () => {
  it("opens the Saved Recipes empty state", async () => {
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /saved recipes/i }));
    expect(
      screen.getByRole("heading", { name: /my recipes/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no saved recipes yet/i)).toBeInTheDocument();
  });

  it("saves a named recipe", async () => {
    const { user } = renderWithProviders(
      <>
        <RecipeActions document={makeRecipeDocument()} />
        <RecipeStatus />
      </>
    );
    await user.click(screen.getByRole("button", { name: /^save recipe$/i }));
    const input = screen.getByRole("textbox", { name: /recipe name/i });
    await user.clear(input);
    await user.type(input, "Friday steel pizza");
    await user.click(
      screen.getByRole("button", { name: /save to my recipes/i })
    );
    expect(
      useRecipeLibraryStore.getState().collection.recipes[0]?.document.name
    ).toBe("Friday steel pizza");
    expect(screen.getByRole("status")).toHaveTextContent(
      /saved to my recipes/i
    );
  });

  it("loads a saved recipe into the calculator", async () => {
    const original = makeRecipeDocument("Loaded recipe");
    const document = {
      ...original,
      calculatorInput: { ...original.calculatorInput, hydration: 0.7 },
    };
    useRecipeLibraryStore.setState({
      collection: saveNewRecipe(
        emptyRecipeCollection(),
        document,
        "2026-08-03T12:00:00.000Z",
        "load-me"
      ),
    });
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /saved recipes/i }));
    await user.click(screen.getByRole("button", { name: /^load$/i }));
    expect(useCalculatorStore.getState().values.hydrationPercent).toBe(70);
    expect(useRecipeLibraryStore.getState().activeRecipeId).toBe("load-me");
  });

  it("renames, duplicates, and confirms deletion", async () => {
    const document = makeRecipeDocument("Original");
    useRecipeLibraryStore.setState({
      collection: saveNewRecipe(
        emptyRecipeCollection(),
        document,
        "2026-08-03T12:00:00.000Z",
        "one"
      ),
    });
    const { user } = renderWithProviders(<RecipeActions document={document} />);
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /saved recipes/i }));
    await user.click(screen.getByRole("button", { name: /rename original/i }));
    const rename = screen.getByRole("textbox", { name: /rename original/i });
    await user.clear(rename);
    await user.type(rename, "Renamed");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(screen.getByText("Renamed")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /duplicate renamed/i })
    );
    expect(screen.getByText("Renamed copy")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete renamed$/i }));
    const confirmation = screen.getByRole("alertdialog", {
      name: /delete renamed/i,
    });
    await user.click(
      within(confirmation).getByRole("button", { name: /delete recipe/i })
    );
    expect(screen.queryByText("Renamed")).not.toBeInTheDocument();
  });

  it("shows a reliable modified state and can revert", async () => {
    const saved = makeRecipeDocument("Saved formula");
    useRecipeLibraryStore.setState({
      collection: saveNewRecipe(
        emptyRecipeCollection(),
        saved,
        "2026-08-03T12:00:00.000Z",
        "one"
      ),
      activeRecipeId: "one",
      workingName: saved.name,
    });
    useCalculatorStore.getState().setValues({ hydrationPercent: 70 });
    renderWithProviders(<DoughCalculator />);
    expect(screen.getByText(/^modified$/i)).toBeInTheDocument();
  });

  it("copies a share URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <>
        <RecipeActions document={makeRecipeDocument()} />
        <RecipeStatus />
      </>
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /^share$/i }));
    await waitFor(() =>
      expect(useRecipeLibraryStore.getState().statusMessage).not.toBeNull()
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("?r="))
    );
    expect(screen.getByRole("status")).toHaveTextContent(/link copied/i);
  });

  it("offers selectable text when clipboard access fails", async () => {
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /^share$/i }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      /clipboard permission was unavailable/i
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: /share link/i,
        }) as HTMLTextAreaElement
      ).value
    ).toContain("?r=");
  });

  it("copies the readable recipe", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /copy recipe/i }));
    await waitFor(() =>
      expect(useRecipeLibraryStore.getState().statusMessage).not.toBeNull()
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("MAIN DOUGH")
      )
    );
  });

  it("previews valid JSON without saving it", async () => {
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    const file = new File(
      [serializeRecipeDocument(makeRecipeDocument("Imported"))],
      "import.json",
      { type: "application/json" }
    );
    await user.upload(screen.getByLabelText(/import recipe json/i), file);
    expect(
      await screen.findByRole("heading", { name: /review imported recipe/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Imported")).toBeInTheDocument();
    expect(useRecipeLibraryStore.getState().collection.recipes).toHaveLength(0);
    await user.click(
      screen.getByRole("button", { name: /apply imported recipe/i })
    );
    expect(useRecipeLibraryStore.getState().collection.recipes).toHaveLength(0);
    expect(useRecipeLibraryStore.getState().workingName).toBe("Imported");
  });

  it("keeps the current recipe after invalid JSON", async () => {
    const before = useCalculatorStore.getState().values.hydrationPercent;
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    await user.upload(
      screen.getByLabelText(/import recipe json/i),
      new File(["{"], "bad.json", { type: "application/json" })
    );
    expect(
      await screen.findByRole("heading", {
        name: /import could not be opened/i,
      })
    ).toBeInTheDocument();
    expect(useCalculatorStore.getState().values.hydrationPercent).toBe(before);
  });

  it("shows storage unavailable state", async () => {
    useRecipeLibraryStore.setState({
      storageMessage: "Local recipe storage is unavailable in this browser.",
    });
    const { user } = renderWithProviders(
      <RecipeActions document={makeRecipeDocument()} />
    );
    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: /saved recipes/i }));
    expect(screen.getByText(/storage is unavailable/i)).toBeInTheDocument();
  });
});

describe("status, identity, and help", () => {
  it("announces a shared recipe load", () => {
    useRecipeLibraryStore.setState({
      statusMessage:
        "Shared recipe loaded. It has not been saved to My Recipes.",
    });
    renderWithProviders(<RecipeStatus />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /shared recipe loaded/i
    );
  });

  it("labels the Formula Signature", () => {
    const document = makeRecipeDocument();
    renderWithProviders(
      <FormulaSignature
        data={createFormulaSignatureData(document.calculatorInput)}
      />
    );
    expect(
      screen.getByRole("img", {
        name: /formula signature for 63 percent hydration/i,
      })
    ).toBeInTheDocument();
  });

  it("keeps contextual help keyboard reachable", async () => {
    const { user } = renderWithProviders(<DoughCalculator />);
    const help = screen.getByRole("button", { name: /help: hydration/i });
    await user.hover(help);
    expect(
      await screen.findByText(
        /total formula water divided by total formula flour/i
      )
    ).toBeInTheDocument();
  });

  it("keeps mobile recipe actions semantically reachable", () => {
    renderWithProviders(<RecipeActions document={makeRecipeDocument()} />);
    expect(
      screen.getByRole("button", { name: /^save recipe$/i })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /recipe actions/i })
    ).toBeVisible();
  });
});
