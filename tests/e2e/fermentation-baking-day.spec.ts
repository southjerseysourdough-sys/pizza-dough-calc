import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("plans backward, saves v2, restores it, and runs Baking Day", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  await page.getByRole("button", { name: "Enable fermentation plan" }).click();
  await expect(
    page.getByRole("button", { name: "Desired bake time" })
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Desired bake date and time").fill("2026-08-09T18:00");
  await page.getByLabel("Cold fermentation").fill("2880");
  await expect(page.getByText("Cold ferment", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Save Recipe" }).click();
  await page.getByLabel("Recipe name").fill("Sunday backward plan");
  await page.getByRole("button", { name: "Save to My Recipes" }).click();
  await expect(
    page.getByText("Sunday backward plan", { exact: true }).first()
  ).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Recipe actions" }).click();
  await page.getByRole("menuitem", { name: "Saved Recipes" }).click();
  await expect(page.getByRole("heading", { name: "My Recipes" })).toBeVisible();
  await page.getByRole("button", { name: "Load" }).click();
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  await expect(page.getByLabel("Desired bake date and time")).toHaveValue(
    "2026-08-09T18:00"
  );
  await expect(page.getByLabel("Cold fermentation")).toHaveValue("2880");
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  await expect(page).toHaveURL(/\/bake$/);
  await expect(page.locator("[data-current-task]")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Weigh ingredients" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Start timer" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(
    page.getByRole("heading", { name: "Update the remaining schedule?" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Shift remaining stages" }).click();
  await expect(page.getByRole("heading", { name: "Mix dough" })).toBeVisible();

  await page.getByRole("button", { name: "Session notes" }).click();
  await page.getByLabel("Current stage note").fill("Mixed smoothly.");
  await page.reload();
  await page.getByRole("button", { name: "Session notes" }).click();
  await expect(page.getByLabel("Current stage note")).toHaveValue(
    "Mixed smoothly."
  );

  await page.getByRole("button", { name: "End Baking Day session" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Bake Report JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/bake-report\.json$/);
  expect(errors).toEqual([]);
});

test("Baking Day current task fits a 375px kitchen viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  await page.getByRole("button", { name: "Enable fermentation plan" }).click();
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  const current = page.locator("[data-current-task]");
  await expect(current).toBeVisible();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
  const box = await current.boundingBox();
  expect(box?.y ?? 9999).toBeLessThan(120);
});

test("reduced motion keeps the planner readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  const enablePlan = page.getByRole("button", {
    name: "Enable fermentation plan",
  });
  await expect(enablePlan).toBeVisible();
  await enablePlan.click();
  await expect(
    page.getByText("Weigh ingredients", { exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "scroll-behavior"
      )
    )
  ).not.toBe("smooth");
});

test("a version one share loads without an invented schedule", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Recipe actions" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("Recipe download did not produce a file.");
  const current = JSON.parse(await readFile(path, "utf8"));
  const legacy = {
    schemaVersion: 1,
    name: current.name,
    calculatorInput: current.calculatorInput,
    context: current.context,
  };
  const payload = Buffer.from(
    JSON.stringify({ schemaVersion: 1, document: legacy })
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  await page.goto(`/?r=${payload}`);
  await expect(page.getByRole("status")).toContainText("Shared recipe loaded");
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  await expect(
    page.getByRole("button", { name: "Enable fermentation plan" })
  ).toBeVisible();
});
