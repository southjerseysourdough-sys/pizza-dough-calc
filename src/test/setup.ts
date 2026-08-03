import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach, vi } from "vitest";

/**
 * jsdom environment shims.
 *
 * jsdom implements no layout engine and none of the pointer capture API, both
 * of which Base UI's popups and Motion rely on. These fill the gaps so
 * component tests exercise real components rather than mocks of them.
 */

/** Media queries currently reported as matching. Tests can add to this. */
let matchingQueries = new Set<string>();

/**
 * Forces a media query to report as matching for the current test, e.g.
 * `setMediaQuery("(prefers-reduced-motion: reduce)")`.
 */
export function setMediaQuery(query: string, matches = true): void {
  if (matches) matchingQueries.add(query);
  else matchingQueries.delete(query);
}

function installMatchMedia(): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matchingQueries.has(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  matchingQueries = new Set<string>();
  installMatchMedia();

  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("IntersectionObserver", ResizeObserverStub);

  // Base UI popups capture the pointer; jsdom has no implementation at all.
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});
