"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BAKING_SESSION_STORAGE_KEY,
  readBakingSession,
} from "@/features/dough-calculator/domain/baking-session";
import { useCalculatorStore } from "@/features/dough-calculator/store/calculator-store";
import { useRecipeLibraryStore } from "@/features/dough-calculator/store/recipe-library-store";
import { emptyRecipeCollection } from "@/features/dough-calculator/utils/recipe-storage";
import { writeRecipeCollection } from "@/features/dough-calculator/utils/recipe-storage";
import {
  createRecipeArchive,
  mergeRecipeArchive,
  parseRecipeArchive,
  replaceWithRecipeArchive,
  serializeBakingSessionExport,
  serializeRecipeArchive,
  type ArchivePreview,
} from "../domain/archive";
import { resetOnboarding } from "../domain/onboarding";
import { usePwa } from "../pwa/pwa-provider";
import { PrivacyPanel } from "./privacy-panel";

type Confirmation = "recipes" | "session" | "draft" | "replace" | null;

function downloadText(contents: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DataManagementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const collection = useRecipeLibraryStore((state) => state.collection);
  const hydrate = useRecipeLibraryStore((state) => state.hydrate);
  const resetDraft = useCalculatorStore((state) => state.reset);
  const { clearAppCaches } = usePwa();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ArchivePreview | null>(null);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const session = open ? readBakingSession() : null;
  const activeSession = session?.ok ? session.value : null;

  useEffect(() => {
    if (open && !useRecipeLibraryStore.getState().hydrated)
      void useRecipeLibraryStore.getState().hydrate();
  }, [open]);

  const applyCollection = (next: typeof collection, success: string) => {
    const result = writeRecipeCollection(next);
    if (result.ok) {
      hydrate();
      setPreview(null);
      setConfirmation(null);
      setMessage(success);
    } else setMessage(result.error.message);
  };

  const importArchive = async (file: File | undefined) => {
    setPreview(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("That archive is larger than the 5 MB local import limit.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = parseRecipeArchive(parsed, collection);
      if (!result.ok) throw new Error(result.message);
      setPreview(result.value);
      setMessage("Archive validated. Review the counts before importing.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "That archive could not be read. Current recipes were left unchanged."
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(48rem,calc(100%-1rem))] max-w-none rounded-xl border-[0.5px] border-graphite bg-carbon shadow-none sm:max-w-[48rem]"
        data-data-management
      >
        <DialogHeader>
          <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
            Local workspace
          </p>
          <DialogTitle className="text-xl">Data Management</DialogTitle>
          <DialogDescription>
            Portable backups and separate recovery controls. No action here
            silently erases everything.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="surface-inset p-4">
            <p className="font-mono text-[9px] text-muted-foreground uppercase">
              Saved recipes
            </p>
            <p className="mt-1 text-2xl font-medium">
              {collection.recipes.length}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadText(
                    serializeRecipeArchive(createRecipeArchive(collection)),
                    "pizza-dough-recipes-v1.json"
                  )
                }
              >
                <DownloadIcon />
                Export all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <UploadIcon />
                Import archive
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) =>
                  void importArchive(event.target.files?.[0])
                }
              />
            </div>
          </section>
          <section className="surface-inset p-4">
            <p className="font-mono text-[9px] text-muted-foreground uppercase">
              Baking Day session
            </p>
            <p className="mt-1 text-sm font-medium">
              {activeSession ? "Active session stored" : "No active session"}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={!activeSession}
              onClick={() =>
                activeSession &&
                downloadText(
                  serializeBakingSessionExport(activeSession),
                  "pizza-dough-baking-day-v1.json"
                )
              }
            >
              <DownloadIcon />
              Export session
            </Button>
          </section>
        </div>

        {preview ? (
          <section
            className="rounded-md border-[0.5px] border-acid-lime/50 bg-inset p-4"
            data-archive-preview
          >
            <h3 className="text-sm font-medium">Archive import preview</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.recipeCount} recipe{preview.recipeCount === 1 ? "" : "s"}{" "}
              · {preview.collisionCount} identifier collision
              {preview.collisionCount === 1 ? "" : "s"}. Merge keeps both by
              assigning collision-safe local identifiers.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  applyCollection(
                    mergeRecipeArchive(collection, preview.archive),
                    "Archive merged without overwriting existing recipes."
                  )
                }
              >
                Merge recipes
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmation("replace")}
              >
                Replace saved recipes…
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreview(null)}
              >
                Cancel
              </Button>
            </div>
          </section>
        ) : null}

        <PrivacyPanel />

        <section className="grid gap-2 border-t-[0.5px] border-graphite pt-4 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => {
              resetOnboarding();
              setMessage(
                "Quick Start progress cleared. Reopen it any time from Help."
              );
            }}
          >
            Reset onboarding
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const result = await clearAppCaches();
              setMessage(
                result.ok
                  ? "Service worker unregistered and app caches cleared. Local recipes and sessions remain."
                  : result.message
              );
            }}
          >
            Unregister service worker and clear app caches
          </Button>
          <Button variant="outline" onClick={() => setConfirmation("draft")}>
            Reset active draft…
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmation("session")}
            disabled={!activeSession}
          >
            Delete active Baking Day session…
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmation("recipes")}
            disabled={collection.recipes.length === 0}
          >
            <Trash2Icon />
            Delete all saved recipes…
          </Button>
        </section>

        {confirmation ? (
          <section
            className="rounded-md border-[0.5px] border-destructive/40 bg-destructive/8 p-4"
            role="alertdialog"
            aria-labelledby="data-confirmation-title"
          >
            <h3 id="data-confirmation-title" className="text-sm font-medium">
              Confirm this separate reset
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {confirmation === "replace"
                ? "Replace the local recipe library with the validated archive? The active draft and Baking Day session stay unchanged."
                : confirmation === "recipes"
                  ? "Delete every saved recipe from this browser? The active draft and Baking Day session stay unchanged."
                  : confirmation === "session"
                    ? "Delete only the active Baking Day session? Saved recipes and the calculator draft stay unchanged."
                    : "Reset only the active calculator draft to its default preset? Saved recipes and Baking Day stay unchanged."}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmation === "replace" && preview)
                    applyCollection(
                      replaceWithRecipeArchive(preview.archive),
                      "Saved recipes replaced with the validated archive."
                    );
                  if (confirmation === "recipes")
                    applyCollection(
                      emptyRecipeCollection(),
                      "All saved recipes were deleted from this browser."
                    );
                  if (confirmation === "session") {
                    localStorage.removeItem(BAKING_SESSION_STORAGE_KEY);
                    setConfirmation(null);
                    setMessage("The active Baking Day session was deleted.");
                  }
                  if (confirmation === "draft") {
                    resetDraft();
                    setConfirmation(null);
                    setMessage("Only the active draft was reset.");
                  }
                }}
              >
                Confirm
              </Button>
              <Button variant="outline" onClick={() => setConfirmation(null)}>
                Keep current data
              </Button>
            </div>
          </section>
        ) : null}

        <p role="status" className="min-h-4 text-xs text-muted-foreground">
          {message}
        </p>
      </DialogContent>
    </Dialog>
  );
}
