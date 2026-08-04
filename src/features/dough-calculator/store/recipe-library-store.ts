"use client";

import { create } from "zustand";

import type {
  LocalRecipeCollection,
  PizzaRecipeDocument,
} from "../domain/recipe-document";
import type { RecipeStorageResult } from "../utils/recipe-storage";

type LibraryState = {
  collection: LocalRecipeCollection;
  activeRecipeId: string | null;
  hydrated: boolean;
  storageMessage: string | null;
  workingName: string | null;
  statusMessage: string | null;
  invalidShare: boolean;
};

type AsyncStorageResult = Promise<RecipeStorageResult<LocalRecipeCollection>>;
type LibraryActions = {
  hydrate: () => AsyncStorageResult;
  save: (document: PizzaRecipeDocument) => AsyncStorageResult;
  update: (id: string, document: PizzaRecipeDocument) => AsyncStorageResult;
  rename: (id: string, name: string) => AsyncStorageResult;
  duplicate: (id: string) => AsyncStorageResult;
  delete: (id: string) => AsyncStorageResult;
  setActiveRecipeId: (id: string | null) => void;
  setWorkingName: (name: string | null) => void;
  setStatusMessage: (message: string | null) => void;
  setInvalidShare: (invalid: boolean) => void;
};

const emptyRecipeCollection = (): LocalRecipeCollection => ({
  schemaVersion: 2,
  recipes: [],
});

async function persist(collection: LocalRecipeCollection): AsyncStorageResult {
  const { writeRecipeCollection } = await import("../utils/recipe-storage");
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

    hydrate: async () => {
      const { readRecipeCollection } = await import("../utils/recipe-storage");
      const result = readRecipeCollection();
      if (result.ok)
        set({ collection: result.value, hydrated: true, storageMessage: null });
      else set({ hydrated: true, storageMessage: result.error.message });
      return result;
    },

    save: async (document) => {
      const { saveNewRecipe } = await import("../utils/recipe-storage");
      const collection = saveNewRecipe(get().collection, document);
      const result = await persist(collection);
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

    update: async (id, document) => {
      const { updateRecipe } = await import("../utils/recipe-storage");
      const changed = updateRecipe(get().collection, id, document);
      if (!changed.ok) return changed;
      const result = await persist(changed.value);
      if (result.ok) set({ collection: result.value, storageMessage: null });
      else set({ storageMessage: result.error.message });
      return result;
    },

    rename: async (id, name) => {
      const { renameRecipe } = await import("../utils/recipe-storage");
      const changed = renameRecipe(get().collection, id, name);
      if (!changed.ok) return changed;
      const result = await persist(changed.value);
      if (result.ok) set({ collection: result.value, storageMessage: null });
      else set({ storageMessage: result.error.message });
      return result;
    },

    duplicate: async (id) => {
      const { duplicateRecipe } = await import("../utils/recipe-storage");
      const changed = duplicateRecipe(get().collection, id);
      if (!changed.ok) return changed;
      const result = await persist(changed.value);
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

    delete: async (id) => {
      const { deleteRecipe } = await import("../utils/recipe-storage");
      const changed = deleteRecipe(get().collection, id);
      if (!changed.ok) return changed;
      const result = await persist(changed.value);
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
