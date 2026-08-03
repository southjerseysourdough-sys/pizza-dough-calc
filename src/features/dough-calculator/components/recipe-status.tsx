"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRecipeLibraryStore } from "../store/recipe-library-store";

export function RecipeStatus() {
  const message = useRecipeLibraryStore((state) => state.statusMessage);
  const invalidShare = useRecipeLibraryStore((state) => state.invalidShare);
  const setInvalidShare = useRecipeLibraryStore(
    (state) => state.setInvalidShare
  );
  const setStatusMessage = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );

  const removeInvalidParameter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("r");
    window.history.replaceState(null, "", url);
    setInvalidShare(false);
    setStatusMessage("Invalid shared recipe parameter removed.");
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        tabIndex={-1}
      >
        {message}
      </div>
      {invalidShare && message ? (
        <div className="flex items-start justify-between gap-3 border-[0.5px] border-warning/30 bg-warning-surface/40 px-3 py-2 text-xs text-foreground">
          <span>{message}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={removeInvalidParameter}
            className="rounded-md"
          >
            <XIcon />
            Remove parameter
          </Button>
        </div>
      ) : null}
    </>
  );
}
