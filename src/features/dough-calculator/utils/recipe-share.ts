import { siteConfig } from "@/config/site";
import {
  RECIPE_SCHEMA_VERSION,
  migrateRecipeDocument,
  sharedPizzaRecipeV2Schema,
  type PizzaRecipeDocument,
  type SharedPizzaRecipeV2,
} from "../domain/recipe-document";

export type ShareResult<T> =
  { ok: true; value: T } | { ok: false; message: string };

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined")
    return Buffer.from(bytes).toString("base64");
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined")
    return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function serializeSharedRecipe(document: PizzaRecipeDocument): string {
  const payload: SharedPizzaRecipeV2 = {
    schemaVersion: RECIPE_SCHEMA_VERSION,
    document,
  };
  const json = JSON.stringify(payload);
  return bytesToBase64(new TextEncoder().encode(json))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function deserializeSharedRecipe(
  value: string
): ShareResult<PizzaRecipeDocument> {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value))
      return { ok: false, message: "The shared recipe link is malformed." };
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = new TextDecoder("utf-8", { fatal: true }).decode(
      base64ToBytes(padded)
    );
    const parsedJson: unknown = JSON.parse(json);
    if (
      typeof parsedJson !== "object" ||
      parsedJson === null ||
      !("schemaVersion" in parsedJson) ||
      !("document" in parsedJson)
    )
      return {
        ok: false,
        message: "The shared recipe is invalid or uses an unsupported version.",
      };
    const wrapperVersion = parsedJson.schemaVersion;
    if (wrapperVersion !== 1 && wrapperVersion !== RECIPE_SCHEMA_VERSION)
      return {
        ok: false,
        message: "The shared recipe is invalid or uses an unsupported version.",
      };
    if (wrapperVersion === RECIPE_SCHEMA_VERSION) {
      const payload = sharedPizzaRecipeV2Schema.safeParse(parsedJson);
      if (!payload.success)
        return {
          ok: false,
          message:
            "The shared recipe is invalid or uses an unsupported version.",
        };
      return migrateRecipeDocument(payload.data.document);
    }
    return migrateRecipeDocument(parsedJson.document);
  } catch {
    return { ok: false, message: "The shared recipe could not be decoded." };
  }
}

export function createRecipeShareUrl(
  document: PizzaRecipeDocument,
  origin?: string
): string {
  const base =
    origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : siteConfig.productionUrl);
  const url = new URL("/", base);
  url.searchParams.set("r", serializeSharedRecipe(document));
  return url.toString();
}

export function readRecipeFromSearchParams(
  searchParams: URLSearchParams
): ShareResult<PizzaRecipeDocument> | null {
  const value = searchParams.get("r");
  return value ? deserializeSharedRecipe(value) : null;
}
