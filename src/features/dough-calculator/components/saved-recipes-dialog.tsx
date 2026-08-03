"use client";

import { CopyIcon, FolderOpenIcon, PencilIcon, Trash2Icon } from "lucide-react";
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
  type LocalSavedPizzaRecipeV1,
  type PizzaRecipeDocumentV1,
} from "../domain/recipe-document";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { areRecipeDocumentsEquivalent } from "../utils/recipe-normalization";
import { createRecipePresentationModel } from "../utils/recipe-presentation";
import { FormulaSignature } from "./formula-signature";

export function SavedRecipesDialog({
  open,
  onOpenChange,
  currentDocument,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocument: PizzaRecipeDocumentV1;
}) {
  const recipes = useRecipeLibraryStore((state) => state.collection.recipes);
  const activeRecipeId = useRecipeLibraryStore((state) => state.activeRecipeId);
  const storageMessage = useRecipeLibraryStore((state) => state.storageMessage);
  const renameRecipe = useRecipeLibraryStore((state) => state.rename);
  const duplicateRecipe = useRecipeLibraryStore((state) => state.duplicate);
  const deleteRecipe = useRecipeLibraryStore((state) => state.delete);
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

  const loadRecipe = (recipe: LocalSavedPizzaRecipeV1) => {
    applyRecipeDocument(recipe.document);
    setActiveRecipeId(recipe.id);
    setWorkingName(recipe.document.name);
    setStatusMessage(`${recipe.document.name} loaded from My Recipes.`);
    onOpenChange(false);
  };

  const confirmRename = (recipe: LocalSavedPizzaRecipeV1) => {
    const name = renameDraft.trim();
    if (!name || name.length > RECIPE_NAME_MAX_LENGTH) return;
    const result = renameRecipe(recipe.id, name);
    if (result.ok) {
      if (activeRecipeId === recipe.id) setWorkingName(name);
      setStatusMessage(`Recipe renamed to ${name}.`);
      setRenamingId(null);
    } else setStatusMessage(result.error.message);
  };

  const duplicate = (recipe: LocalSavedPizzaRecipeV1) => {
    const result = duplicateRecipe(recipe.id);
    setStatusMessage(
      result.ok ? `${recipe.document.name} duplicated.` : result.error.message
    );
  };

  const remove = (recipe: LocalSavedPizzaRecipeV1) => {
    const result = deleteRecipe(recipe.id);
    setStatusMessage(
      result.ok ? `${recipe.document.name} deleted.` : result.error.message
    );
    setDeleteId(null);
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
    );
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
                  Save the current formula to keep it in this browser.
                </p>
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
                                  confirmRename(recipe);
                                if (event.key === "Escape") setRenamingId(null);
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => confirmRename(recipe)}
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
                          onClick={() => duplicate(recipe)}
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
                            onClick={() => remove(recipe)}
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
