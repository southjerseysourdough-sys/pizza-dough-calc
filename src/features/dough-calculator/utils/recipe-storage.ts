import {
  RECIPE_SCHEMA_VERSION,
  localRecipeCollectionV1Schema,
  migrateRecipeCollection,
  type LocalRecipeCollectionV1,
  type LocalSavedPizzaRecipeV1,
  type PizzaRecipeDocumentV1,
} from "../domain/recipe-document";

export const RECIPE_STORAGE_KEY = "sjs:pizza-dough-calculator:recipes:v1";

export type RecipeStorageErrorCode =
  "unavailable" | "invalid-data" | "quota-exceeded" | "missing-recipe";
export type RecipeStorageResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: { code: RecipeStorageErrorCode; message: string; raw?: string };
    };

export const emptyRecipeCollection = (): LocalRecipeCollectionV1 => ({
  schemaVersion: RECIPE_SCHEMA_VERSION,
  recipes: [],
});

function identifier(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function storageOrError(storage?: Storage): RecipeStorageResult<Storage> {
  try {
    const value =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    return value
      ? { ok: true, value }
      : {
          ok: false,
          error: {
            code: "unavailable",
            message: "Local recipe storage is unavailable in this browser.",
          },
        };
  } catch {
    return {
      ok: false,
      error: {
        code: "unavailable",
        message: "This browser blocked access to local recipe storage.",
      },
    };
  }
}

export function readRecipeCollection(
  storage?: Storage
): RecipeStorageResult<LocalRecipeCollectionV1> {
  const available = storageOrError(storage);
  if (!available.ok) return available;
  try {
    const raw = available.value.getItem(RECIPE_STORAGE_KEY);
    if (raw === null) return { ok: true, value: emptyRecipeCollection() };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        error: {
          code: "invalid-data",
          message:
            "Saved recipe data is not valid JSON and was left unchanged.",
          raw,
        },
      };
    }
    const migrated = migrateRecipeCollection(parsed);
    return migrated.ok
      ? { ok: true, value: migrated.value }
      : {
          ok: false,
          error: { code: "invalid-data", message: migrated.message, raw },
        };
  } catch {
    return {
      ok: false,
      error: {
        code: "unavailable",
        message: "Saved recipes could not be read from this browser.",
      },
    };
  }
}

export function writeRecipeCollection(
  collection: LocalRecipeCollectionV1,
  storage?: Storage
): RecipeStorageResult<LocalRecipeCollectionV1> {
  const parsed = localRecipeCollectionV1Schema.safeParse(collection);
  if (!parsed.success)
    return {
      ok: false,
      error: {
        code: "invalid-data",
        message: "The recipe collection is invalid and was not written.",
      },
    };
  const available = storageOrError(storage);
  if (!available.ok) return available;
  try {
    available.value.setItem(RECIPE_STORAGE_KEY, JSON.stringify(parsed.data));
    return { ok: true, value: parsed.data };
  } catch (error) {
    const isQuota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return {
      ok: false,
      error: {
        code: isQuota ? "quota-exceeded" : "unavailable",
        message: isQuota
          ? "Browser storage is full. No recipe was changed."
          : "The browser could not save this recipe.",
      },
    };
  }
}

export function saveNewRecipe(
  collection: LocalRecipeCollectionV1,
  document: PizzaRecipeDocumentV1,
  now = new Date().toISOString(),
  id = identifier()
): LocalRecipeCollectionV1 {
  const recipe: LocalSavedPizzaRecipeV1 = {
    id,
    createdAt: now,
    updatedAt: now,
    document,
  };
  return { ...collection, recipes: [recipe, ...collection.recipes] };
}

export function findRecipeById(
  collection: LocalRecipeCollectionV1,
  id: string
): LocalSavedPizzaRecipeV1 | undefined {
  return collection.recipes.find((recipe) => recipe.id === id);
}

export function updateRecipe(
  collection: LocalRecipeCollectionV1,
  id: string,
  document: PizzaRecipeDocumentV1,
  now = new Date().toISOString()
): RecipeStorageResult<LocalRecipeCollectionV1> {
  if (!findRecipeById(collection, id))
    return {
      ok: false,
      error: {
        code: "missing-recipe",
        message: "That saved recipe no longer exists.",
      },
    };
  return {
    ok: true,
    value: {
      ...collection,
      recipes: collection.recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, updatedAt: now, document } : recipe
      ),
    },
  };
}

export function renameRecipe(
  collection: LocalRecipeCollectionV1,
  id: string,
  name: string,
  now = new Date().toISOString()
): RecipeStorageResult<LocalRecipeCollectionV1> {
  const recipe = findRecipeById(collection, id);
  if (!recipe)
    return {
      ok: false,
      error: {
        code: "missing-recipe",
        message: "That saved recipe no longer exists.",
      },
    };
  return updateRecipe(
    collection,
    id,
    { ...recipe.document, name: name.trim() },
    now
  );
}

export function duplicateRecipe(
  collection: LocalRecipeCollectionV1,
  id: string,
  now = new Date().toISOString(),
  newId = identifier()
): RecipeStorageResult<LocalRecipeCollectionV1> {
  const recipe = findRecipeById(collection, id);
  if (!recipe)
    return {
      ok: false,
      error: {
        code: "missing-recipe",
        message: "That saved recipe no longer exists.",
      },
    };
  return {
    ok: true,
    value: saveNewRecipe(
      collection,
      { ...recipe.document, name: `${recipe.document.name} copy` },
      now,
      newId
    ),
  };
}

export function deleteRecipe(
  collection: LocalRecipeCollectionV1,
  id: string
): RecipeStorageResult<LocalRecipeCollectionV1> {
  if (!findRecipeById(collection, id))
    return {
      ok: false,
      error: {
        code: "missing-recipe",
        message: "That saved recipe no longer exists.",
      },
    };
  return {
    ok: true,
    value: {
      ...collection,
      recipes: collection.recipes.filter((recipe) => recipe.id !== id),
    },
  };
}
