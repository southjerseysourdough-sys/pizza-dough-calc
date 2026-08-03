import { screen } from "@testing-library/react";

/**
 * Accessible queries shared by the calculator component tests.
 *
 * These deliberately go through roles and labels rather than class names or
 * component internals, so a restyle cannot break the suite but a genuine
 * accessibility regression will.
 */

/** The live recipe landmark. */
export function recipeRegion(): HTMLElement {
  return screen.getByRole("region", { name: /your recipe/i });
}

/** A number input, addressed by its visible label. */
export function numberInput(name: string | RegExp): HTMLInputElement {
  return screen.getByRole("spinbutton", { name }) as HTMLInputElement;
}

/** Every warning and error currently on screen, as plain text. */
export function issueMessages(): string[] {
  return screen
    .queryAllByRole("listitem")
    .map((item) => item.textContent ?? "")
    .filter((text) => /error:|heads up:|note:/i.test(text));
}

export function hasIssueMatching(pattern: RegExp): boolean {
  return issueMessages().some((message) => pattern.test(message));
}
