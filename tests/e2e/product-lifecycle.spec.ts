import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const actions = async (page: Page) => {
  await page.getByRole("button", { name: "Recipe actions" }).click();
};

test("saves, reloads, renames, duplicates, and deletes a local recipe", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Save Recipe" }).click();
  await page
    .getByRole("textbox", { name: "Recipe name" })
    .fill("Friday steel pizza");
  await page.getByRole("button", { name: "Save to My Recipes" }).click();
  await expect(page.getByRole("status")).toContainText("saved to My Recipes");

  await page.reload();
  await actions(page);
  await page.getByRole("menuitem", { name: "Saved Recipes" }).click();
  await expect(page.getByText("Friday steel pizza")).toBeVisible();
  await page.getByRole("button", { name: "Rename Friday steel pizza" }).click();
  await page
    .getByRole("textbox", { name: "Rename Friday steel pizza" })
    .fill("Saturday steel pizza");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Saturday steel pizza" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate Saturday steel pizza" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saturday steel pizza copy" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Saturday steel pizza copy" })
    .click();
  await page
    .getByRole("alertdialog", { name: "Delete Saturday steel pizza copy" })
    .getByRole("button", { name: "Delete recipe" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saturday steel pizza copy" })
  ).toHaveCount(0);
});

test("shares source input without automatically saving it", async ({
  browser,
}) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await actions(page);
  await page.getByRole("menuitem", { name: "Share", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("link copied");
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toContain("?r=");

  const sharedPage = await context.newPage();
  await sharedPage.goto(sharedUrl);
  await expect(sharedPage.getByRole("status")).toContainText(
    "Shared recipe loaded"
  );
  const stored = await sharedPage.evaluate(() =>
    localStorage.getItem("sjs:pizza-dough-calculator:recipes:v1")
  );
  expect(stored).toBeNull();
  await context.close();
});

test("copies text, exports and imports JSON, downloads PDF, and starts print", async ({
  page,
}) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await actions(page);
  await page.getByRole("menuitem", { name: "Copy Recipe" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Readable recipe copied"
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "MAIN DOUGH"
  );

  await actions(page);
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download JSON" }).click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toMatch(/\.json$/);
  const jsonPath = await json.path();
  expect(jsonPath).not.toBeNull();
  await page.locator('input[type="file"]').setInputFiles(jsonPath!);
  await expect(
    page.getByRole("heading", { name: "Review imported recipe" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply imported recipe" }).click();
  await expect(page.getByRole("status")).toContainText("has not been saved");

  await actions(page);
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download PDF" }).click();
  const pdf = await pdfDownload;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  const pdfPath = await pdf.path();
  expect(pdfPath).not.toBeNull();
  const bytes = await readFile(pdfPath!);
  expect(bytes.byteLength).toBeGreaterThan(1000);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");

  await actions(page);
  await page.getByRole("menuitem", { name: "Print", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    /Preparing|Print dialog opened/
  );
});

test("keeps actions reachable without horizontal overflow at 375 pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Save Recipe" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Recipe actions" })
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("maps the pizza frames forward and backward with format selection", async ({
  page,
}) => {
  await page.goto("/");
  const field = page.locator("[data-dough-field]");
  const sequence = field.locator("[data-pizza-sequence]");
  await expect(sequence).toHaveAttribute("data-pizza-frame", "0");

  await page.getByText("Sicilian or sheet pan", { exact: true }).click();
  await expect(field).toHaveAttribute("data-dough-field", "rectangular");
  await expect(sequence).toHaveAttribute("data-pizza-frame", "29");
  await expect(field).toContainText("Pizza Preview / Pan");

  await page.getByText("Round on steel", { exact: true }).click();
  await expect(sequence).toHaveAttribute("data-pizza-frame", "0");
});

test("serves the manifest and supports dark, light, and reduced-motion paths", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("label").filter({ hasText: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator("label").filter({ hasText: "Light theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const response = await request.get(manifestHref!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(
    manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "any")
  ).toBe(true);
  expect(errors).toEqual([]);
});
