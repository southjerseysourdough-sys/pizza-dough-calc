import type { BakingSessionV1 } from "@/features/dough-calculator/domain/baking-session";
import {
  migrateRecipeCollection,
  type LocalRecipeCollection,
  type LocalSavedPizzaRecipeV2,
} from "@/features/dough-calculator/domain/recipe-document";

export const LOCAL_ARCHIVE_VERSION = 1 as const;

export type LocalRecipeArchiveV1 = {
  archiveVersion: typeof LOCAL_ARCHIVE_VERSION;
  exportedAt: string;
  recipes: LocalRecipeCollection;
};

export type ArchivePreview = {
  archive: LocalRecipeArchiveV1;
  recipeCount: number;
  collisionCount: number;
};

export type ArchiveResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

export function createRecipeArchive(
  recipes: LocalRecipeCollection,
  now = new Date()
): LocalRecipeArchiveV1 {
  return {
    archiveVersion: LOCAL_ARCHIVE_VERSION,
    exportedAt: now.toISOString(),
    recipes,
  };
}

export function serializeRecipeArchive(archive: LocalRecipeArchiveV1): string {
  return JSON.stringify(archive, null, 2);
}

export function parseRecipeArchive(
  input: unknown,
  current: LocalRecipeCollection
): ArchiveResult<ArchivePreview> {
  if (!input || typeof input !== "object" || !("archiveVersion" in input))
    return { ok: false, message: "This is not a recognized recipe archive." };
  if (input.archiveVersion !== LOCAL_ARCHIVE_VERSION)
    return {
      ok: false,
      message: `Recipe archive version ${String(input.archiveVersion)} is not supported. Your current recipes were left unchanged.`,
    };
  if (!("exportedAt" in input) || typeof input.exportedAt !== "string")
    return { ok: false, message: "The recipe archive date is invalid." };
  if (!("recipes" in input))
    return {
      ok: false,
      message: "The recipe archive has no recipe collection.",
    };
  const migrated = migrateRecipeCollection(input.recipes);
  if (!migrated.ok) return { ok: false, message: migrated.message };
  const currentIds = new Set(current.recipes.map((recipe) => recipe.id));
  return {
    ok: true,
    value: {
      archive: {
        archiveVersion: LOCAL_ARCHIVE_VERSION,
        exportedAt: input.exportedAt,
        recipes: migrated.value,
      },
      recipeCount: migrated.value.recipes.length,
      collisionCount: migrated.value.recipes.filter((recipe) =>
        currentIds.has(recipe.id)
      ).length,
    },
  };
}

function collisionSafeId(id: string, used: Set<string>): string {
  if (!used.has(id)) return id;
  let suffix = 1;
  while (used.has(`${id}-imported-${suffix}`)) suffix += 1;
  return `${id}-imported-${suffix}`;
}

export function mergeRecipeArchive(
  current: LocalRecipeCollection,
  archive: LocalRecipeArchiveV1
): LocalRecipeCollection {
  const used = new Set(current.recipes.map((recipe) => recipe.id));
  const imported: LocalSavedPizzaRecipeV2[] = archive.recipes.recipes.map(
    (recipe) => {
      const id = collisionSafeId(recipe.id, used);
      used.add(id);
      return id === recipe.id ? recipe : { ...recipe, id };
    }
  );
  return { ...current, recipes: [...imported, ...current.recipes] };
}

export function replaceWithRecipeArchive(
  archive: LocalRecipeArchiveV1
): LocalRecipeCollection {
  return archive.recipes;
}

export function serializeBakingSessionExport(session: BakingSessionV1): string {
  return JSON.stringify(
    { exportVersion: 1, exportedAt: new Date().toISOString(), session },
    null,
    2
  );
}
