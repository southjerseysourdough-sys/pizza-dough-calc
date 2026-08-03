import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/layout/site-header";
import { hasIssueMatching, recipeRegion } from "@/test/calculator-queries";
import {
  renderWithProviders,
  resetCalculatorStore,
} from "@/test/render-calculator";
import { setMediaQuery } from "@/test/setup";

import { DoughCalculator } from "../components/dough-calculator";

beforeEach(resetCalculatorStore);

describe("theme toggle", () => {
  it("offers system, light and dark", () => {
    renderWithProviders(<SiteHeader />);

    expect(
      screen.getByRole("radio", { name: /system theme/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /light theme/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /dark theme/i })
    ).toBeInTheDocument();
  });

  it("is reachable and operable from the keyboard", async () => {
    const { user } = renderWithProviders(<SiteHeader />);

    await user.tab();

    // Tab lands inside the radio group without needing a pointer.
    const system = screen.getByRole("radio", { name: /system theme/i });
    const light = screen.getByRole("radio", { name: /light theme/i });
    const dark = screen.getByRole("radio", { name: /dark theme/i });
    expect([system, light, dark]).toContain(document.activeElement);

    // Arrow keys move between options, which is native radio behaviour and
    // the reason this is a radio group rather than a cycling button.
    await user.keyboard("{ArrowRight}");
    expect([system, light, dark]).toContain(document.activeElement);
    expect(document.activeElement).toHaveAttribute("type", "radio");
  });

  it("selects a theme with the keyboard", async () => {
    const { user } = renderWithProviders(<SiteHeader />);

    const dark = screen.getByRole("radio", { name: /dark theme/i });
    dark.focus();
    await user.keyboard("{ }");

    expect(dark).toBeChecked();
  });

  it("names the group for assistive technology", () => {
    renderWithProviders(<SiteHeader />);

    expect(
      screen.getByRole("group", { name: /colour theme/i })
    ).toBeInTheDocument();
  });
});

describe("reduced motion", () => {
  it("still renders the whole calculator", () => {
    setMediaQuery("(prefers-reduced-motion: reduce)");
    renderWithProviders(<DoughCalculator />);

    // Nothing may be gated behind an animation completing.
    expect(recipeRegion()).toBeInTheDocument();
    expect(recipeRegion()).toHaveTextContent("563 g");
    expect(
      screen.getByRole("tab", { name: /round on steel/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /pizza diameter/i })
    ).toBeInTheDocument();
  });

  it("still shows warnings", () => {
    setMediaQuery("(prefers-reduced-motion: reduce)");
    renderWithProviders(<DoughCalculator />);

    // Equipment fit guidance sits beside the recipe rather than inside it.
    expect(hasIssueMatching(/wider than the 15" short side/i)).toBe(true);
  });

  it("renders identically to the animated path", () => {
    const { unmount } = renderWithProviders(<DoughCalculator />);
    const animatedText = recipeRegion().textContent;
    unmount();

    resetCalculatorStore();
    setMediaQuery("(prefers-reduced-motion: reduce)");
    renderWithProviders(<DoughCalculator />);

    // Reduced motion changes how things arrive, never what is there.
    expect(recipeRegion().textContent).toBe(animatedText);
  });
});
