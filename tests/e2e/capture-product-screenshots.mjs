import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = "http://127.0.0.1:3000";
const output = "/home/lumindae/dev/pizza-dough-calc/docs/screenshots";

await mkdir(output, { recursive: true });
const browser = await chromium.launch();

async function openPage(width, height, theme = "dark") {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page
    .locator("label")
    .filter({ hasText: `${theme === "dark" ? "Dark" : "Light"} theme` })
    .click();
  await page.waitForTimeout(80);
  return { context, page };
}

async function captureProduct(filename, width, height, theme = "dark") {
  const { context, page } = await openPage(width, height, theme);
  await page.screenshot({ path: `${output}/${filename}` });
  await context.close();
}

for (const [filename, width, height, theme] of [
  ["product-dark-1440.png", 1440, 1100, "dark"],
  ["product-dark-768.png", 768, 1024, "dark"],
  ["product-dark-430.png", 430, 932, "dark"],
  ["product-dark-375.png", 375, 812, "dark"],
  ["product-light-1440.png", 1440, 1100, "light"],
]) {
  await captureProduct(filename, width, height, theme);
}

async function openSavedRecipes(filename, width, height) {
  const { context, page } = await openPage(width, height);
  await page.getByRole("button", { name: "Save Recipe" }).click();
  await page
    .getByRole("textbox", { name: "Recipe name" })
    .fill("Saturday steel pizza");
  await page.getByRole("button", { name: "Save to My Recipes" }).click();
  await page.getByRole("button", { name: "Recipe actions" }).click();
  await page.getByRole("menuitem", { name: "Saved Recipes" }).click();
  await page.getByRole("heading", { name: "My Recipes" }).waitFor();
  await page.screenshot({ path: `${output}/${filename}` });
  await context.close();
}

await openSavedRecipes("saved-recipes-dark-1440.png", 1440, 1100);
await openSavedRecipes("saved-recipes-mobile-375.png", 375, 812);

{
  const { context, page } = await openPage(1100, 900);
  await page.getByRole("button", { name: "Recipe actions" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download JSON" }).click();
  const download = await downloadEvent;
  const jsonPath = await download.path();
  await page.locator('input[type="file"]').setInputFiles(jsonPath);
  await page.getByRole("heading", { name: "Review imported recipe" }).waitFor();
  await page.screenshot({ path: `${output}/import-preview-dark.png` });
  await context.close();
}

{
  const { context, page } = await openPage(900, 1100, "light");
  await page.locator(".recipe-print-sheet").evaluate((sheet) => {
    document.body.append(sheet);
    document.querySelector("main")?.remove();
    document.querySelector("header")?.remove();
    document.body.style.background = "white";
    sheet.removeAttribute("aria-hidden");
    sheet.style.position = "absolute";
    sheet.style.left = "0";
    sheet.style.top = "0";
  });
  await page.locator(".recipe-print-sheet").screenshot({
    path: `${output}/print-preview.png`,
  });
  await context.close();
}

await browser.close();
