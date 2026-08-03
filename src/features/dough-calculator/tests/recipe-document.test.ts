import { describe, expect, it } from "vitest";

import {
  localRecipeCollectionV1Schema,
  localSavedPizzaRecipeV1Schema,
  migrateRecipeCollection,
  migrateRecipeDocument,
  pizzaRecipeDocumentV1Schema,
  sharedPizzaRecipeV1Schema,
} from "../domain/recipe-document";
import { makeRecipeDocument } from "./recipe-fixtures";

describe("versioned recipe documents", () => {
  it("validates a canonical document", () =>
    expect(
      pizzaRecipeDocumentV1Schema.safeParse(makeRecipeDocument()).success
    ).toBe(true));
  it("validates a saved recipe envelope", () =>
    expect(
      localSavedPizzaRecipeV1Schema.safeParse({
        id: "one",
        createdAt: "2026-08-03T12:00:00.000Z",
        updatedAt: "2026-08-03T12:00:00.000Z",
        document: makeRecipeDocument(),
      }).success
    ).toBe(true));
  it("validates a collection", () =>
    expect(
      localRecipeCollectionV1Schema.safeParse({ schemaVersion: 1, recipes: [] })
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
      localRecipeCollectionV1Schema.safeParse({
        schemaVersion: 1,
        recipes: [saved, saved],
      }).success
    ).toBe(false);
  });
  it("validates a share payload", () =>
    expect(
      sharedPizzaRecipeV1Schema.safeParse({
        schemaVersion: 1,
        document: makeRecipeDocument(),
      }).success
    ).toBe(true));
  it("migrates version one documents", () =>
    expect(migrateRecipeDocument(makeRecipeDocument()).ok).toBe(true));
  it("migrates version one collections", () =>
    expect(migrateRecipeCollection({ schemaVersion: 1, recipes: [] }).ok).toBe(
      true
    ));
  it("fails safely for unknown document versions", () =>
    expect(migrateRecipeDocument({ schemaVersion: 2 }).ok).toBe(false));
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
