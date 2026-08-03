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

/**
 * Every advisory, note and error currently on screen, as plain text.
 *
 * Each entry opens with its severity heading, which is what distinguishes an
 * issue list item from any other list item on the page.
 */
export function issueMessages(): string[] {
  return screen
    .queryAllByRole("listitem")
    .map((item) => item.textContent ?? "")
    .filter((text) => /check this value|worth knowing|note/i.test(text));
}

export function hasIssueMatching(pattern: RegExp): boolean {
  return issueMessages().some((message) => pattern.test(message));
}

/**
 * Expands the full ingredient ledger.
 *
 * The headline result deliberately leads and the exact per-ingredient figures
 * sit one disclosure away, so any test asserting on those figures opens it
 * first — which also proves the disclosure still reveals them.
 */
export async function openLedger(user: {
  click: (element: Element) => Promise<void>;
}): Promise<void> {
  await user.click(
    screen.getByRole("button", { name: /full ingredient ledger/i })
  );
}
