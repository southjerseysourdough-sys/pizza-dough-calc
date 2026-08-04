import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const onboardingKey = "pdc:onboarding:v1";

async function completeOnboardingBeforeReload(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => {
    localStorage.clear();
    localStorage.setItem(key, "complete");
  }, onboardingKey);
  await page.reload();
}

async function openCommand(page: Page, query: string) {
  await page.getByRole("button", { name: "Open command palette" }).click();
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill(query);
  return page.getByRole("option").filter({ hasText: query }).first();
}

async function startBakingDay(page: Page) {
  await completeOnboardingBeforeReload(page);
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  const enablePlan = page.getByRole("button", {
    name: "Enable fermentation plan",
  });
  await expect(enablePlan).toBeVisible();
  await enablePlan.click();
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  await expect(page).toHaveURL(/\/bake$/);
  await expect(page.locator("[data-current-task]")).toBeVisible();
}

test("onboarding persists and keyboard and touch commands perform real work", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const onboarding = page.locator("[data-onboarding]");
  await expect(onboarding).toBeVisible();
  await onboarding.getByRole("button", { name: "Next" }).click();
  await expect(onboarding).toContainText("Enter size and quantity");
  await onboarding.getByRole("button", { name: "Skip" }).click();
  await page.reload();
  await expect(onboarding).toHaveCount(0);

  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("combobox", { name: "Search commands" })
  ).toBeFocused();
  await page
    .getByRole("combobox", { name: "Search commands" })
    .fill("Set hydration");
  await page.getByRole("option", { name: /set hydration/i }).click();
  const focusedHydration = page.getByRole("spinbutton", { name: "hydration" });
  await focusedHydration.fill("69.5");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Hydration" }).first()
  ).toHaveValue("69.5");
  await expect(page.getByRole("status")).toContainText(
    "Hydration set to 69.5%"
  );

  await page.getByRole("button", { name: "Open command palette" }).click();
  await page
    .getByRole("combobox", { name: "Search commands" })
    .fill("Open Fermentation Planner");
  await page
    .getByRole("option", { name: /open fermentation planner/i })
    .click();
  await expect(
    page.getByRole("region", { name: "Fermentation" })
  ).toBeVisible();
});

test("a prepared Baking Day remains usable offline with timer and notes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("net::ERR_INTERNET_DISCONNECTED")
    )
      errors.push(message.text());
  });

  await startBakingDay(page);
  const prepare = page.getByRole("button", { name: "Prepare for Offline Use" });
  await expect(prepare).toBeEnabled();
  await prepare.click();
  await expect(
    page.getByRole("button", { name: "Prepared for Offline Use" })
  ).toBeVisible({ timeout: 20_000 });

  const cacheAudit = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map((request) => request.url)
        )
      )
    ).flat();
    return { names, urls };
  });
  expect(cacheAudit.names.some((name) => name.startsWith("pdc-shell-v1"))).toBe(
    true
  );
  expect(cacheAudit.urls.some((url) => url.includes("?r="))).toBe(false);

  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", {
      configurable: true,
      get: () => localStorage.getItem("pdc:test-offline") !== "1",
    });
  });
  await page.evaluate(() => localStorage.setItem("pdc:test-offline", "1"));
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("status").filter({ hasText: "Offline" })
  ).toBeVisible();
  await expect(page.locator("[data-current-task]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Session notes" }).click();
  await page.getByLabel("Current stage note").fill("Offline kitchen note.");
  await expect(page.getByLabel("Current stage note")).toHaveValue(
    "Offline kitchen note."
  );
  await page.context().setOffline(false);
  await page.evaluate(() => localStorage.removeItem("pdc:test-offline"));
  await page.reload();
  await page.getByRole("button", { name: "Session notes" }).click();
  await expect(page.getByLabel("Current stage note")).toHaveValue(
    "Offline kitchen note."
  );
  expect(errors).toEqual([]);
});

test("archive export, destructive confirmation, merge preview, and cache clearing preserve data boundaries", async ({
  page,
}) => {
  await completeOnboardingBeforeReload(page);
  await page.getByRole("button", { name: "Save Recipe" }).click();
  await page.getByLabel("Recipe name").fill("Launch backup recipe");
  await page.getByRole("button", { name: "Save to My Recipes" }).click();

  await (await openCommand(page, "Open Data Management")).click();
  await expect(
    page.getByRole("heading", { name: "Data Management" })
  ).toBeVisible();
  const archiveDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all" }).click();
  const archive = await archiveDownload;
  const archivePath = await archive.path();
  expect(archivePath).not.toBeNull();
  const archiveJson = JSON.parse(await readFile(archivePath!, "utf8"));
  expect(archiveJson.archiveVersion).toBe(1);
  expect(archiveJson.recipes.recipes).toHaveLength(1);

  await page.getByRole("button", { name: "Delete all saved recipes" }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toContainText(
    "active draft and Baking Day session stay unchanged"
  );
  await confirmation.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("0", { exact: true }).first()).toBeVisible();

  await page
    .locator("[data-data-management]")
    .locator('input[type="file"]')
    .setInputFiles(archivePath!);
  const preview = page.locator("[data-archive-preview]");
  await expect(preview).toContainText("1 recipe");
  await preview.getByRole("button", { name: "Merge recipes" }).click();
  const dataManager = page.locator("[data-data-management]");
  await expect(dataManager.getByRole("status")).toContainText("Archive merged");

  await page
    .getByRole("button", {
      name: "Unregister service worker and clear app caches",
    })
    .click();
  await expect(dataManager.getByRole("status")).toContainText(
    "Local recipes and sessions remain"
  );
  await page.getByRole("button", { name: "Close" }).click();

  await (await openCommand(page, "Open Saved Recipes")).click();
  await expect(page.locator("[data-saved-recipe]")).toContainText(
    "Launch backup recipe"
  );
});

test("mocked install cancellation is user initiated and mobile landscape has no overflow", async ({
  page,
}) => {
  await completeOnboardingBeforeReload(page);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt");
    Object.defineProperties(event, {
      prompt: {
        value: async () => {
          (window as Window & { installPrompted?: boolean }).installPrompted =
            true;
        },
      },
      userChoice: {
        value: Promise.resolve({ outcome: "dismissed" }),
      },
    });
    window.dispatchEvent(event);
  });
  await (await openCommand(page, "Install App")).click();
  await expect(page.getByRole("status")).toContainText(
    "Installation was not completed"
  );
  expect(
    await page.evaluate(
      () => (window as Window & { installPrompted?: boolean }).installPrompted
    )
  ).toBe(true);

  await page.setViewportSize({ width: 812, height: 375 });
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  const enablePlan = page.getByRole("button", {
    name: "Enable fermentation plan",
  });
  await expect(enablePlan).toBeVisible();
  await enablePlan.click();
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  await expect(page.locator("[data-current-task]")).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(layout.content).toBeLessThanOrEqual(layout.viewport);
});
