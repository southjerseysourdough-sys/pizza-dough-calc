import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import manifest from "@/app/manifest";
import robots from "@/app/robots";
import { presetToFormValues } from "@/features/dough-calculator/presets/preset-form-values";
import { DEFAULT_PRESET } from "@/features/dough-calculator/presets/formulas";
import { makeRecipeDocument } from "@/features/dough-calculator/tests/recipe-fixtures";
import {
  emptyRecipeCollection,
  saveNewRecipe,
} from "@/features/dough-calculator/utils/recipe-storage";
import { validateCalculatorFormValues } from "@/features/dough-calculator/utils/form-values";

import {
  createRecipeArchive,
  mergeRecipeArchive,
  parseRecipeArchive,
  replaceWithRecipeArchive,
  serializeRecipeArchive,
} from "../domain/archive";
import { detectBrowserCapabilities } from "../domain/browser-capabilities";
import { COMMANDS, commandStates } from "../domain/commands";
import { normalizeProductionError } from "../domain/errors";
import { resolveFeedbackUrl } from "../domain/feedback";
import {
  HELP_TOPICS,
  PRIVACY_AND_DATA_FACTS,
  findHelpTopic,
} from "../domain/help-content";
import {
  InstallCapabilityAdapter,
  type DeferredInstallPrompt,
} from "../domain/install";
import {
  ONBOARDING_STORAGE_KEY,
  completeOnboarding,
  hasCompletedOnboarding,
  resetOnboarding,
} from "../domain/onboarding";
import { createApplicationStructuredData } from "../domain/structured-data";
import { APP_CACHE_PREFIX, APP_CACHE_VERSION } from "../pwa/pwa-config";

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

function installEvent(
  outcome: "accepted" | "dismissed",
  prompt = vi.fn().mockResolvedValue(undefined)
): DeferredInstallPrompt {
  const event = new Event("beforeinstallprompt") as DeferredInstallPrompt;
  Object.defineProperties(event, {
    prompt: { value: prompt },
    userChoice: { value: Promise.resolve({ outcome }) },
  });
  return event;
}

describe("launch domain", () => {
  it("detects progressive browser capabilities without user-agent assumptions", () => {
    const capabilities = detectBrowserCapabilities({
      navigator: {
        userAgent: "Mozilla/5.0 (iPhone)",
        clipboard: { writeText: vi.fn() },
        share: vi.fn(),
        serviceWorker: {} as ServiceWorkerContainer,
      } as unknown as Navigator,
      window: {
        matchMedia: () => ({ matches: true }) as MediaQueryList,
      } as unknown as Window,
      document: { createElement: vi.fn() } as unknown as Document,
      notification: {},
    });

    expect(capabilities).toMatchObject({
      clipboard: true,
      download: true,
      share: true,
      notifications: true,
      serviceWorker: true,
      standalone: true,
      ios: true,
    });
  });

  it("holds install permission in memory and reports every outcome", async () => {
    const adapter = new InstallCapabilityAdapter();
    const accepted = installEvent("accepted");
    const preventDefault = vi.spyOn(accepted, "preventDefault");
    adapter.capture(accepted);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(adapter.available).toBe(true);
    await expect(adapter.request()).resolves.toBe("accepted");
    expect(adapter.available).toBe(false);

    adapter.capture(installEvent("dismissed"));
    await expect(adapter.request()).resolves.toBe("dismissed");
    await expect(adapter.request()).resolves.toBe("failed");

    const failedPrompt = vi.fn().mockRejectedValue(new Error("unavailable"));
    adapter.capture(installEvent("accepted", failedPrompt));
    await expect(adapter.request()).resolves.toBe("failed");
  });

  it("versions and resets onboarding completion", () => {
    const storage = new MemoryStorage();
    expect(ONBOARDING_STORAGE_KEY).toBe("pdc:onboarding:v1");
    expect(hasCompletedOnboarding(storage)).toBe(false);
    expect(completeOnboarding(storage)).toBe(true);
    expect(hasCompletedOnboarding(storage)).toBe(true);
    expect(resetOnboarding(storage)).toBe(true);
    expect(hasCompletedOnboarding(storage)).toBe(false);
  });

  it("ships the complete concise help and privacy corpus", () => {
    expect(HELP_TOPICS).toHaveLength(16);
    expect(findHelpTopic("readability")?.body.join(" ")).toContain(
      "Atkinson Hyperlegible Next"
    );
    expect(findHelpTopic("fermentation")?.body.join(" ")).toContain(
      "Backward planning"
    );
    expect(findHelpTopic("missing")).toBeUndefined();
    expect(PRIVACY_AND_DATA_FACTS.join(" ")).toContain(
      "Anyone with that URL can read the recipe data"
    );
    expect(PRIVACY_AND_DATA_FACTS.join(" ")).toContain(
      "no account or cloud synchronization"
    );
  });

  it("exports, validates, previews, merges, and replaces recipe archives", () => {
    const current = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument("Current"),
      "2026-08-03T12:00:00.000Z",
      "same-id"
    );
    const incoming = saveNewRecipe(
      emptyRecipeCollection(),
      makeRecipeDocument("Imported"),
      "2026-08-03T13:00:00.000Z",
      "same-id"
    );
    const archive = createRecipeArchive(
      incoming,
      new Date("2026-08-03T14:00:00.000Z")
    );
    expect(JSON.parse(serializeRecipeArchive(archive))).toEqual(archive);

    const preview = parseRecipeArchive(archive, current);
    expect(preview).toMatchObject({
      ok: true,
      value: { recipeCount: 1, collisionCount: 1 },
    });
    const merged = mergeRecipeArchive(current, archive);
    expect(merged.recipes).toHaveLength(2);
    expect(new Set(merged.recipes.map((recipe) => recipe.id)).size).toBe(2);
    expect(merged.recipes[0]?.id).toBe("same-id-imported-1");
    expect(replaceWithRecipeArchive(archive)).toEqual(incoming);
  });

  it("rejects invalid and future archives without producing replacement data", () => {
    const current = emptyRecipeCollection();
    expect(parseRecipeArchive({}, current)).toMatchObject({ ok: false });
    expect(
      parseRecipeArchive(
        { archiveVersion: 99, exportedAt: "future", recipes: current },
        current
      )
    ).toEqual({
      ok: false,
      message:
        "Recipe archive version 99 is not supported. Your current recipes were left unchanged.",
    });
  });

  it("only exposes deliberately configured feedback protocols", () => {
    expect(resolveFeedbackUrl(undefined)).toBeNull();
    expect(resolveFeedbackUrl("javascript:alert(1)")).toBeNull();
    expect(resolveFeedbackUrl("not a url")).toBeNull();
    expect(resolveFeedbackUrl("mailto:hello@example.com")).toBe(
      "mailto:hello@example.com"
    );
    expect(resolveFeedbackUrl("https://example.com/form")).toBe(
      "https://example.com/form"
    );
  });

  it("normalizes errors without suggesting that local data was deleted", () => {
    const chunkError = new Error("old chunk");
    chunkError.name = "ChunkLoadError";
    expect(normalizeProductionError(chunkError)).toMatchObject({
      title: "This workspace needs a fresh copy",
      message: expect.stringContaining("recipes are not removed"),
    });
    expect(normalizeProductionError("unknown").message).toContain(
      "remain in this browser"
    );
  });

  it("maps contextual command disabled states", () => {
    expect(COMMANDS).toHaveLength(19);
    const unavailable = commandStates({
      hasValidRecipe: false,
      hasFermentationPlan: false,
      installAvailable: false,
    });
    expect(unavailable.find(({ id }) => id === "save-recipe")?.isDisabled).toBe(
      true
    );
    expect(
      unavailable.find(({ id }) => id === "start-baking-day")?.isDisabled
    ).toBe(true);
    expect(unavailable.find(({ id }) => id === "open-help")?.isDisabled).toBe(
      false
    );
    expect(
      commandStates({
        hasValidRecipe: true,
        hasFermentationPlan: true,
        installAvailable: true,
      }).every(({ isDisabled }) => !isDisabled)
    ).toBe(true);
  });

  it("generates accurate app metadata, manifest, robots, and structured data", () => {
    const appManifest = manifest();
    expect(appManifest).toMatchObject({
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#08090a",
    });
    expect(appManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ purpose: "maskable" }),
      ])
    );
    expect(robots()).toMatchObject({ rules: { disallow: ["/offline"] } });

    const graph = createApplicationStructuredData()["@graph"];
    expect(graph.map((node) => node["@type"])).toEqual([
      "WebApplication",
      "Organization",
      "WebSite",
    ]);
  });

  it("keeps the service-worker cache contract synchronized and query-safe", () => {
    const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(source).toContain(`const CACHE_PREFIX = "${APP_CACHE_PREFIX}"`);
    expect(source).toContain(`const CACHE_VERSION = "${APP_CACHE_VERSION}"`);
    expect(source).toContain('url.search === ""');
    expect(source).toContain('request.method !== "GET"');
    expect(source).toContain('url.pathname.startsWith("/media/")');
    expect(source).toContain('message?.type === "SKIP_WAITING"');
  });

  it("rejects corrupt draft discriminants before calculation", () => {
    const values = presetToFormValues(DEFAULT_PRESET);
    const issues = validateCalculatorFormValues({
      ...values,
      shape: "triangle" as typeof values.shape,
      yeastType: "unknown" as typeof values.yeastType,
    });
    expect(issues.map(({ field }) => field)).toEqual(
      expect.arrayContaining(["shape", "yeastType"])
    );
  });
});
