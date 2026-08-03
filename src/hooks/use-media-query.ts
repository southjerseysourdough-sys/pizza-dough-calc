"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Built on `useSyncExternalStore` so the
 * server snapshot is explicit (`false`) and React can tear-check the value
 * during concurrent renders.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  // Media queries cannot be evaluated on the server; assume "no match".
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Matches Tailwind's `md` breakpoint. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
