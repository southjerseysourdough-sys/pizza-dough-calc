"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Single client boundary for every app-wide context provider.
 *
 * Keeping them in one client component lets `app/layout.tsx` stay a Server
 * Component: only this subtree ships to the browser, and `children` rendered
 * on the server are passed through untouched.
 *
 * Add new providers here, outermost first.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider delay={200}>{children}</TooltipProvider>;
}
