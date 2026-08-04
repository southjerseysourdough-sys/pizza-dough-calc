"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { PizzaRecipeDocument } from "@/features/dough-calculator/domain/recipe-document";
import { useCalculatorStore } from "@/features/dough-calculator/store/calculator-store";
import { useRecipeLibraryStore } from "@/features/dough-calculator/store/recipe-library-store";
import { hasCompletedOnboarding } from "../domain/onboarding";
import { LAUNCH_EVENT, type LaunchAction } from "./launch-events";

const CommandPalette = dynamic(() =>
  import("./command-palette").then((module) => module.CommandPalette)
);
const HelpDialog = dynamic(() =>
  import("./help-dialog").then((module) => module.HelpDialog)
);
const DataManagementDialog = dynamic(() =>
  import("./data-management-dialog").then(
    (module) => module.DataManagementDialog
  )
);
const OnboardingPanel = dynamic(() =>
  import("./onboarding-panel").then((module) => module.OnboardingPanel)
);

export function LaunchTools({
  document,
}: {
  document: PizzaRecipeDocument | null;
}) {
  const [workspace, setWorkspace] = useState<LaunchAction | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingExplicit, setOnboardingExplicit] = useState(false);
  const startHandled = useRef(false);
  const setFermentationWorkspaceOpen = useCalculatorStore(
    (state) => state.setFermentationWorkspaceOpen
  );
  const setStatusMessage = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setWorkspace("commands");
      }
    };
    const onAction = (event: Event) => {
      const action = (event as CustomEvent<LaunchAction>).detail;
      if (action === "onboarding") {
        setOnboardingExplicit(true);
        setShowOnboarding(true);
      } else setWorkspace(action);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(LAUNCH_EVENT, onAction);

    const idle = window.setTimeout(() => {
      if (!hasCompletedOnboarding()) setShowOnboarding(true);
    }, 900);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(LAUNCH_EVENT, onAction);
    };
  }, []);

  useEffect(() => {
    if (startHandled.current || !document) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") !== "baking-day") return;
    startHandled.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("start");
    window.history.replaceState(null, "", url);
    if (!document.fermentationPlan?.enabled) {
      setFermentationWorkspaceOpen(true);
      setStatusMessage(
        "Add or review a fermentation plan, then start Baking Day from the planner."
      );
      return;
    }
    void import("@/features/dough-calculator/utils/start-baking-day").then(
      async ({ startBakingDaySession }) => {
        const result = await startBakingDaySession(document);
        if (result.ok) window.location.assign("/bake");
        else setStatusMessage(result.message);
      }
    );
  }, [document, setFermentationWorkspaceOpen, setStatusMessage]);

  return (
    <>
      {showOnboarding ? (
        <OnboardingPanel
          explicit={onboardingExplicit}
          onClose={() => {
            setShowOnboarding(false);
            setOnboardingExplicit(false);
          }}
        />
      ) : null}
      {workspace === "commands" ? (
        <CommandPalette
          open
          document={document}
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
        />
      ) : null}
      {workspace === "help" ? (
        <HelpDialog
          open
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
        />
      ) : null}
      {workspace === "data" ? (
        <DataManagementDialog
          open
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
        />
      ) : null}
    </>
  );
}
