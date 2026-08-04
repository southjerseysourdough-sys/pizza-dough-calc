import { describe, expect, it } from "vitest";

import {
  localRecipeCollectionV1Schema,
  localRecipeCollectionV2Schema,
  localSavedPizzaRecipeV1Schema,
  localSavedPizzaRecipeV2Schema,
  migrateRecipeCollection,
  migrateRecipeDocument,
  pizzaRecipeDocumentV1Schema,
  pizzaRecipeDocumentV2Schema,
  sharedPizzaRecipeV1Schema,
  sharedPizzaRecipeV2Schema,
} from "../domain/recipe-document";
import {
  makeLegacyRecipeDocument,
  makeRecipeDocument,
} from "./recipe-fixtures";

describe("versioned recipe documents", () => {
  it("validates a canonical document", () =>
    expect(
      pizzaRecipeDocumentV2Schema.safeParse(makeRecipeDocument()).success
    ).toBe(true));
  it("validates a saved recipe envelope", () =>
    expect(
      localSavedPizzaRecipeV2Schema.safeParse({
        id: "one",
        createdAt: "2026-08-03T12:00:00.000Z",
        updatedAt: "2026-08-03T12:00:00.000Z",
        document: makeRecipeDocument(),
      }).success
    ).toBe(true));
  it("validates a collection", () =>
    expect(
      localRecipeCollectionV2Schema.safeParse({ schemaVersion: 2, recipes: [] })
        .success
    ).toBe(true));
  it("rejects duplicate collection identifiers", () => {
    const saved = {
      id: "same",
      createdAt: "2026-08-03T12:00:00.000Z",
      updatedAt: "2026-08-03T12:00:00.000Z",
      document: makeRecipeDocument(),
    };
    expect(
      localRecipeCollectionV2Schema.safeParse({
        schemaVersion: 2,
        recipes: [saved, saved],
      }).success
    ).toBe(false);
  });
  it("validates a share payload", () =>
    expect(
      sharedPizzaRecipeV2Schema.safeParse({
        schemaVersion: 2,
        document: makeRecipeDocument(),
      }).success
    ).toBe(true));
  it("migrates version one documents", () => {
    const migrated = migrateRecipeDocument(makeLegacyRecipeDocument());
    expect(migrated.ok).toBe(true);
    expect(migrated.ok && migrated.value.schemaVersion).toBe(2);
    expect(migrated.ok && migrated.value.fermentationPlan).toBeUndefined();
    expect(
      pizzaRecipeDocumentV1Schema.safeParse(makeLegacyRecipeDocument()).success
    ).toBe(true);
  });
  it("migrates version one collections", () => {
    expect(migrateRecipeCollection({ schemaVersion: 1, recipes: [] })).toEqual({
      ok: true,
      value: { schemaVersion: 2, recipes: [] },
    });
    expect(
      localRecipeCollectionV1Schema.safeParse({ schemaVersion: 1, recipes: [] })
        .success
    ).toBe(true);
    expect(
      localSavedPizzaRecipeV1Schema.safeParse({
        id: "legacy",
        createdAt: "2026-08-03T12:00:00.000Z",
        updatedAt: "2026-08-03T12:00:00.000Z",
        document: makeLegacyRecipeDocument(),
      }).success
    ).toBe(true);
    expect(
      sharedPizzaRecipeV1Schema.safeParse({
        schemaVersion: 1,
        document: makeLegacyRecipeDocument(),
      }).success
    ).toBe(true);
  });
  it("fails safely for unknown document versions", () =>
    expect(migrateRecipeDocument({ schemaVersion: 3 }).ok).toBe(false));
  it("fails safely for unknown collection versions", () =>
    expect(migrateRecipeCollection({ schemaVersion: 8, recipes: [] }).ok).toBe(
      false
    ));
  it("rejects invalid formula input", () => {
    const document = makeRecipeDocument();
    expect(
      migrateRecipeDocument({
        ...document,
        calculatorInput: { ...document.calculatorInput, hydration: -1 },
      }).ok
    ).toBe(false);
  });
});
