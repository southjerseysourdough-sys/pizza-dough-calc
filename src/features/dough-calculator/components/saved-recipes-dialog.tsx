"use client";

import {
  CopyIcon,
  FolderOpenIcon,
  PencilIcon,
  PlayIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  RECIPE_NAME_MAX_LENGTH,
  type LocalSavedPizzaRecipeV2,
  type PizzaRecipeDocument,
} from "../domain/recipe-document";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { areRecipeDocumentsEquivalent } from "../utils/recipe-normalization";
import { createRecipePresentationModel } from "../utils/recipe-presentation";
import { FormulaSignature } from "./formula-signature";
import { formatTimelineTimestamp } from "../domain/fermentation";
import { startBakingDaySession } from "../utils/start-baking-day";
import { dispatchLaunchAction } from "@/features/launch/ui/launch-events";

export function SavedRecipesDialog({
  open,
  onOpenChange,
  currentDocument,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocument: PizzaRecipeDocument;
}) {
  const recipes = useRecipeLibraryStore((state) => state.collection.recipes);
  const activeRecipeId = useRecipeLibraryStore((state) => state.activeRecipeId);
  const storageMessage = useRecipeLibraryStore((state) => state.storageMessage);
  const renameRecipe = useRecipeLibraryStore((state) => state.rename);
  const duplicateRecipe = useRecipeLibraryStore((state) => state.duplicate);
  const deleteRecipe = useRecipeLibraryStore((state) => state.delete);
  const saveRecipe = useRecipeLibraryStore((state) => state.save);
  const setActiveRecipeId = useRecipeLibraryStore(
    (state) => state.setActiveRecipeId
  );
  const setWorkingName = useRecipeLibraryStore((state) => state.setWorkingName);
  const setStatusMessage = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );
  const applyRecipeDocument = useCalculatorStore(
    (state) => state.applyRecipeDocument
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...recipes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [recipes]
  );

  const loadRecipe = (recipe: LocalSavedPizzaRecipeV2) => {
    applyRecipeDocument(recipe.document);
    setActiveRecipeId(recipe.id);
    setWorkingName(recipe.document.name);
    setStatusMessage(`${recipe.document.name} loaded from My Recipes.`);
    onOpenChange(false);
  };

  const confirmRename = async (recipe: LocalSavedPizzaRecipeV2) => {
    const name = renameDraft.trim();
    if (!name || name.length > RECIPE_NAME_MAX_LENGTH) return;
    const result = await renameRecipe(recipe.id, name);
    if (result.ok) {
      if (activeRecipeId === recipe.id) setWorkingName(name);
      setStatusMessage(`Recipe renamed to ${name}.`);
      setRenamingId(null);
    } else setStatusMessage(result.error.message);
  };

  const duplicate = async (recipe: LocalSavedPizzaRecipeV2) => {
    const result = await duplicateRecipe(recipe.id);
    setStatusMessage(
      result.ok ? `${recipe.document.name} duplicated.` : result.error.message
    );
  };

  const remove = async (recipe: LocalSavedPizzaRecipeV2) => {
    const result = await deleteRecipe(recipe.id);
    setStatusMessage(
      result.ok ? `${recipe.document.name} deleted.` : result.error.message
    );
    setDeleteId(null);
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
    );
  };

  const startBakingDay = async (recipe: LocalSavedPizzaRecipeV2) => {
    const result = await startBakingDaySession(recipe.document);
    if (!result.ok) {
      setStatusMessage(result.message);
      loadRecipe(recipe);
      useCalculatorStore.getState().setFermentationWorkspaceOpen(true);
      return;
    }
    window.location.assign("/bake");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(86vh,48rem)] gap-0 overflow-hidden rounded-xl border-[0.5px] border-graphite bg-carbon p-0 shadow-none sm:max-w-3xl">
        <DialogHeader className="border-b-[0.5px] border-graphite p-5 pr-12">
          <span className="font-mono text-[9px] tracking-[0.12em] text-acid-lime uppercase">
            Local recipe library
          </span>
          <DialogTitle className="text-xl font-normal">My Recipes</DialogTitle>
          <DialogDescription>
            Saved only in this browser. Share or export JSON for a portable
            copy.
          </DialogDescription>
        </DialogHeader>
        <div ref={listRef} className="overflow-y-auto p-4 sm:p-5">
          {storageMessage ? (
            <div className="mb-4 border-l-2 border-warning px-3 py-2 text-sm text-foreground">
              {storageMessage}
            </div>
          ) : null}
          {sorted.length === 0 ? (
            <div className="grid min-h-56 place-items-center border-[0.5px] border-dashed border-smoke/70 p-8 text-center">
              <div>
                <FolderOpenIcon className="mx-auto mb-3 size-5 text-muted-foreground" />
                <p className="text-sm text-foreground">No saved recipes yet</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Saving keeps this editable formula on this device. Export JSON
                  from Data Management for a portable backup.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const result = await saveRecipe(currentDocument);
                      setStatusMessage(
                        result.ok
                          ? `${currentDocument.name} saved to My Recipes.`
                          : result.error.message
                      );
                    }}
                  >
                    <SaveIcon />
                    Save Current Recipe
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      onOpenChange(false);
                      dispatchLaunchAction("data");
                    }}
                  >
                    Data &amp; backup
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sorted.map((recipe) => {
                const presentation = createRecipePresentationModel(
                  recipe.document
                );
                if (!presentation.ok) return null;
                const model = presentation.value;
                const modified =
                  activeRecipeId === recipe.id &&
                  !areRecipeDocumentsEquivalent(
                    currentDocument,
                    recipe.document
                  );
                return (
                  <article
                    key={recipe.id}
                    className="surface-instrument flex flex-col gap-3 p-3"
                    data-saved-recipe={recipe.id}
                  >
                    <div className="flex gap-3">
                      <FormulaSignature
                        data={model.signature}
                        className="size-16"
                      />
                      <div className="min-w-0 flex-1">
                        {renamingId === recipe.id ? (
                          <div className="flex gap-1">
                            <Input
                              aria-label={`Rename ${recipe.document.name}`}
                              value={renameDraft}
                              maxLength={RECIPE_NAME_MAX_LENGTH}
                              autoFocus
                              onChange={(event) =>
                                setRenameDraft(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter")
                                  void confirmRename(recipe);
                                if (event.key === "Escape") setRenamingId(null);
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => void confirmRename(recipe)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="truncate text-sm font-medium">
                              {recipe.document.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {model.style}
                            </p>
                          </>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground">
                          <span>{model.size}</span>
                          <span>{Math.round(model.hydration * 100)}%</span>
                          <span>
                            {Math.round(model.totalDoughWeightGrams)} g
                          </span>
                          {model.schedule ? (
                            <span className="text-acid-lime">
                              Bake{" "}
                              {formatTimelineTimestamp(
                                model.schedule.bakeTimestamp
                              )}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t-[0.5px] border-graphite pt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {modified ? (
                          <strong className="font-medium text-acid-lime">
                            Modified
                          </strong>
                        ) : (
                          `Updated ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(recipe.updatedAt))}`
                        )}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => loadRecipe(recipe)}
                        >
                          <FolderOpenIcon />
                          Load
                        </Button>
                        {model.schedule ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Start Baking Day for ${recipe.document.name}`}
                            onClick={() => void startBakingDay(recipe)}
                          >
                            <PlayIcon />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${recipe.document.name}`}
                          onClick={() => {
                            setRenamingId(recipe.id);
                            setRenameDraft(recipe.document.name);
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Duplicate ${recipe.document.name}`}
                          onClick={() => void duplicate(recipe)}
                        >
                          <CopyIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${recipe.document.name}`}
                          onClick={() => setDeleteId(recipe.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                    {deleteId === recipe.id ? (
                      <div
                        role="alertdialog"
                        aria-label={`Delete ${recipe.document.name}`}
                        className="border-t-[0.5px] border-destructive/30 pt-3"
                      >
                        <p className="text-xs">
                          Delete <strong>{recipe.document.name}</strong> from
                          this browser?
                        </p>
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => void remove(recipe)}
                          >
                            Delete recipe
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
