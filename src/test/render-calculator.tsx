import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

import { Providers } from "@/components/providers";
import { useCalculatorStore } from "@/features/dough-calculator/store/calculator-store";

/**
 * Test helpers for the calculator.
 *
 * Everything renders inside the real `Providers` tree, so tests exercise the
 * same tooltip and theme context the application uses.
 */

/**
 * Resets the module-level store between tests.
 *
 * The store is a singleton, so without this a value set in one test would leak
 * into the next.
 */
export function resetCalculatorStore(): void {
  useCalculatorStore.getState().reset();
}

export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup();
  const result = render(<Providers>{ui}</Providers>);
  return { user, ...result };
}

/**
 * Opens the advanced section, which is where the flour blend and custom
 * ingredient editors live.
 */
export function showAdvanced(): void {
  useCalculatorStore.getState().setShowAdvanced(true);
}
