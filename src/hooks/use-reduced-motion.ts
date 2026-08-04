"use client";

import { useMediaQuery } from "./use-media-query";

/** Shared, dependency-free reduced-motion preference. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
