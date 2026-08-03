"use client";

import { ThemeProvider } from "next-themes";
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
  return (
    <ThemeProvider
      // The `dark` custom variant in globals.css keys off a class, so the
      // existing semantic tokens keep working untouched.
      attribute="class"
      defaultTheme="dark"
      enableSystem
      // Suppresses the cross-fade that would otherwise sweep every colour on
      // the page when the theme flips.
      disableTransitionOnChange
    >
      <TooltipProvider delay={200}>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
