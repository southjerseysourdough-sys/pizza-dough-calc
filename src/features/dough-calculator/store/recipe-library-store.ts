"use client";

import { create } from "zustand";

import type {
  LocalRecipeCollectionV1,
  PizzaRecipeDocumentV1,
} from "../domain/recipe-document";
import {
  deleteRecipe,
  duplicateRecipe,
  emptyRecipeCollection,
  readRecipeCollection,
  renameRecipe,
  saveNewRecipe,
  updateRecipe,
  writeRecipeCollection,
  type RecipeStorageResult,
} from "../utils/recipe-storage";

type LibraryState = {
  collection: LocalRecipeCollectionV1;
  activeRecipeId: string | null;
  hydrated: boolean;
  storageMessage: string | null;
  workingName: string | null;
  statusMessage: string | null;
  invalidShare: boolean;
};

type LibraryActions = {
  hydrate: () => RecipeStorageResult<LocalRecipeCollectionV1>;
  save: (
    document: PizzaRecipeDocumentV1
  ) => RecipeStorageResult<LocalRecipeCollectionV1>;
  update: (
    id: string,
    document: PizzaRecipeDocumentV1
  ) => RecipeStorageResult<LocalRecipeCollectionV1>;
  rename: (
    id: string,
    name: string
  ) => RecipeStorageResult<LocalRecipeCollectionV1>;
  duplicate: (id: string) => RecipeStorageResult<LocalRecipeCollectionV1>;
  delete: (id: string) => RecipeStorageResult<LocalRecipeCollectionV1>;
  setActiveRecipeId: (id: string | null) => void;
  setWorkingName: (name: string | null) => void;
  setStatusMessage: (message: string | null) => void;
  setInvalidShare: (invalid: boolean) => void;
};

function persist(
  collection: LocalRecipeCollectionV1
): RecipeStorageResult<LocalRecipeCollectionV1> {
  return writeRecipeCollection(collection);
}

export const useRecipeLibraryStore = create<LibraryState & LibraryActions>(
  (set, get) => ({
    collection: emptyRecipeCollection(),
    activeRecipeId: null,
    hydrated: false,
    storageMessage: null,
    workingName: null,
    statusMessage: null,
    invalidShare: false,

    hydrate: () => {
      const result = readRecipeCollection();
      if (result.ok)
        set({ collection: result.value, hydrated: true, storageMessage: null });
      else set({ hydrated: true, storageMessage: result.error.message });
      return result;
    },

    save: (document) => {
      const collection = saveNewRecipe(get().collection, document);
      const result = persist(collection);
      if (result.ok)
        set({
          collection: result.value,
          activeRecipeId: result.value.recipes[0]?.id ?? null,
          workingName: document.name,
          storageMessage: null,
        });
      else set({ storageMessage: result.error.message });
      return result;
    },

    update: (id, document) => {
      const changed = updateRecipe(get().collection, id, document);
      if (!changed.ok) return changed;
      const result = persist(changed.value);
      if (result.ok) set({ collection: result.value, storageMessage: null });
      else set({ storageMessage: result.error.message });
      return result;
    },

    rename: (id, name) => {
      const changed = renameRecipe(get().collection, id, name);
      if (!changed.ok) return changed;
      const result = persist(changed.value);
      if (result.ok) set({ collection: result.value, storageMessage: null });
      else set({ storageMessage: result.error.message });
      return result;
    },

    duplicate: (id) => {
      const changed = duplicateRecipe(get().collection, id);
      if (!changed.ok) return changed;
      const result = persist(changed.value);
      if (result.ok)
        set({
          collection: result.value,
          activeRecipeId: result.value.recipes[0]?.id ?? null,
          workingName: result.value.recipes[0]?.document.name ?? null,
          storageMessage: null,
        });
      else set({ storageMessage: result.error.message });
      return result;
    },

    delete: (id) => {
      const changed = deleteRecipe(get().collection, id);
      if (!changed.ok) return changed;
      const result = persist(changed.value);
      if (result.ok)
        set({
          collection: result.value,
          activeRecipeId:
            get().activeRecipeId === id ? null : get().activeRecipeId,
          storageMessage: null,
        });
      else set({ storageMessage: result.error.message });
      return result;
    },

    setActiveRecipeId: (activeRecipeId) => set({ activeRecipeId }),
    setWorkingName: (workingName) => set({ workingName }),
    setStatusMessage: (statusMessage) => set({ statusMessage }),
    setInvalidShare: (invalidShare) => set({ invalidShare }),
  })
);
