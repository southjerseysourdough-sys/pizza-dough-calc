import { describe, expect, it } from "vitest";

import {
  createRecipeShareUrl,
  deserializeSharedRecipe,
  readRecipeFromSearchParams,
  serializeSharedRecipe,
} from "../utils/recipe-share";
import {
  makeLegacyRecipeDocument,
  makeRecipeDocument,
} from "./recipe-fixtures";

describe("shared recipe URLs", () => {
  it("round trips Unicode names", () => {
    const document = makeRecipeDocument("Grandma’s 🍕 – Montréal");
    const decoded = deserializeSharedRecipe(serializeSharedRecipe(document));
    expect(decoded.ok && decoded.value.name).toBe(document.name);
  });
  it("uses only URL-safe Base64 characters", () =>
    expect(serializeSharedRecipe(makeRecipeDocument())).toMatch(
      /^[A-Za-z0-9_-]+$/
    ));
  it("is deterministic", () => {
    const document = makeRecipeDocument();
    expect(serializeSharedRecipe(document)).toBe(
      serializeSharedRecipe(document)
    );
  });
  it("loads a version one shared payload without inventing a schedule", () => {
    const payload = Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        document: makeLegacyRecipeDocument(),
      })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const decoded = deserializeSharedRecipe(payload);
    expect(decoded.ok).toBe(true);
    expect(decoded.ok && decoded.value.schemaVersion).toBe(2);
    expect(decoded.ok && decoded.value.fermentationPlan).toBeUndefined();
  });
  it("rejects invalid Base64", () =>
    expect(deserializeSharedRecipe("not+url/safe=").ok).toBe(false));
  it("rejects invalid JSON", () =>
    expect(deserializeSharedRecipe("bm90LWpzb24").ok).toBe(false));
  it("creates an r query parameter", () => {
    const url = new URL(
      createRecipeShareUrl(makeRecipeDocument(), "https://example.com")
    );
    expect(url.origin).toBe("https://example.com");
    expect(url.searchParams.has("r")).toBe(true);
  });
  it("extracts a recipe from search parameters", () => {
    const serialized = serializeSharedRecipe(makeRecipeDocument());
    expect(
      readRecipeFromSearchParams(new URLSearchParams({ r: serialized }))?.ok
    ).toBe(true);
  });
  it("returns null with no share parameter", () =>
    expect(readRecipeFromSearchParams(new URLSearchParams())).toBeNull());
});
