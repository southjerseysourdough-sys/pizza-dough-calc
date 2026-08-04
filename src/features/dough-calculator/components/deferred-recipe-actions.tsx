"use client";

import dynamic from "next/dynamic";
import { MoreHorizontalIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PizzaRecipeDocument } from "../domain/recipe-document";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import { areRecipeDocumentsEquivalent } from "../utils/recipe-normalization";
import {
  RECIPE_ACTION_EVENT,
  type RecipeAction,
} from "@/features/launch/ui/recipe-action-events";

const RecipeActions = dynamic(() =>
  import("./recipe-actions").then((module) => module.RecipeActions)
);

export function DeferredRecipeActions({
  document,
}: {
  document: PizzaRecipeDocument;
}) {
  const [initialAction, setInitialAction] = useState<RecipeAction | null>(null);
  const collection = useRecipeLibraryStore((state) => state.collection);
  const activeRecipeId = useRecipeLibraryStore((state) => state.activeRecipeId);
  const activeRecipe =
    collection.recipes.find((recipe) => recipe.id === activeRecipeId) ?? null;
  const modified = activeRecipe
    ? !areRecipeDocumentsEquivalent(document, activeRecipe.document)
    : false;

  useEffect(() => {
    const onAction = (event: Event) =>
      setInitialAction((event as CustomEvent<RecipeAction>).detail);
    window.addEventListener(RECIPE_ACTION_EVENT, onAction);
    return () => window.removeEventListener(RECIPE_ACTION_EVENT, onAction);
  }, []);

  if (initialAction)
    return <RecipeActions document={document} initialAction={initialAction} />;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-recipe-actions
      data-onboarding-target="actions"
    >
      <Button
        size="sm"
        className="rounded-md bg-acid-lime text-void hover:bg-acid-lime/85"
        onClick={() => setInitialAction("save")}
      >
        <SaveIcon />
        Save Recipe
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-md"
        onClick={() => setInitialAction("menu")}
      >
        <MoreHorizontalIcon />
        Recipe actions
      </Button>
      {modified ? (
        <span className="font-mono text-[9px] tracking-[0.08em] text-acid-lime uppercase">
          Modified
        </span>
      ) : null}
    </div>
  );
}
