"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeMode } from "@/types";

/**
 * Cross-cutting UI state only — chrome, preferences, layout. Feature state
 * belongs to its own store under the feature folder that owns it.
 */
type UiState = {
  theme: ThemeMode;
  sidebarOpen: boolean;
};

type UiActions = {
  setTheme: (theme: ThemeMode) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarOpen: true,

      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "pdc:ui",
      // Actions are recreated on every load; only persist the data.
      partialize: ({ theme, sidebarOpen }) => ({ theme, sidebarOpen }),
    }
  )
);
