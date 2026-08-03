"use client";

import { useSyncExternalStore } from "react";

// The value never changes after hydration, so the store never notifies.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `false` on the server and during hydration, then `true`.
 *
 * Use it to gate anything that would otherwise cause a hydration mismatch —
 * persisted store values, `window` reads, portals.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useState` + `useEffect` pair: React's compiler lint rules reject a
 * synchronous `setState` inside an effect, and this expresses the same intent
 * without the extra render pass.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
