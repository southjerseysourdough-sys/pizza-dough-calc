import { describe, expect, it } from "vitest";

import {
  deleteRecipe,
  duplicateRecipe,
  emptyRecipeCollection,
  findRecipeById,
  readRecipeCollection,
  renameRecipe,
  RECIPE_STORAGE_KEY,
  saveNewRecipe,
  updateRecipe,
  writeRecipeCollection,
} from "../utils/recipe-storage";
import { makeRecipeDocument } from "./recipe-fixtures";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("local recipe storage", () => {
  it("reads an empty collection", () =>
    expect(readRecipeCollection(new MemoryStorage())).toEqual({
      ok: true,
      value: emptyRecipeCollection(),
    }));
  it("writes and reads a collection", () => {
    const storage = new MemoryStorage();
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    expect(writeRecipeCollection(collection, storage).ok).toBe(true);
    const read = readRecipeCollection(storage);
    expect(read.ok && read.value.recipes).toHaveLength(1);
  });
  it("saves a new recipe", () =>
    expect(
      saveNewRecipe(
        emptyRecipeCollection(),
        makeRecipeDocument(),
        "2026-08-03T12:00:00.000Z",
        "one"
      ).recipes[0]?.id
    ).toBe("one"));
  it("updates a recipe", () => {
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    const changed = updateRecipe(
      collection,
      "one",
      makeRecipeDocument("Updated")
    );
    expect(changed.ok && changed.value.recipes[0]?.document.name).toBe(
      "Updated"
    );
  });
  it("renames without requiring uniqueness", () => {
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    const changed = renameRecipe(collection, "one", "  Same name  ");
    expect(changed.ok && changed.value.recipes[0]?.document.name).toBe(
      "Same name"
    );
  });
  it("duplicates with a new identifier", () => {
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    const changed = duplicateRecipe(
      collection,
      "one",
      "2026-08-03T13:00:00.000Z",
      "two"
    );
    expect(
      changed.ok && changed.value.recipes.map((recipe) => recipe.id)
    ).toEqual(["two", "one"]);
  });
  it("deletes a recipe", () => {
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    const changed = deleteRecipe(collection, "one");
    expect(changed.ok && changed.value.recipes).toHaveLength(0);
  });
  it("finds a recipe by identifier", () => {
    const collection = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument(),
      "2026-08-03T12:00:00.000Z",
      "one"
    );
    expect(findRecipeById(collection, "one")?.id).toBe("one");
  });
  it("reports missing identifiers", () =>
    expect(deleteRecipe(emptyRecipeCollection(), "missing").ok).toBe(false));
  it("leaves invalid JSON untouched", () => {
    const storage = new MemoryStorage();
    storage.setItem(RECIPE_STORAGE_KEY, "{");
    const result = readRecipeCollection(storage);
    expect(result.ok).toBe(false);
    expect(storage.getItem(RECIPE_STORAGE_KEY)).toBe("{");
  });
  it("reports storage quota failure", () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    const result = writeRecipeCollection(emptyRecipeCollection(), storage);
    expect(!result.ok && result.error.code).toBe("quota-exceeded");
  });
});
