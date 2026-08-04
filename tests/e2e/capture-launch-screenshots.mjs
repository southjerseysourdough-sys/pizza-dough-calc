import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = "http://127.0.0.1:3000";
const output = "/home/lumindae/dev/pizza-dough-calc/docs/screenshots";
const onboardingKey = "pdc:onboarding:v1";

await mkdir(output, { recursive: true });
const browser = await chromium.launch();

async function openPage(width, height, theme = "dark", onboarding = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ key, complete }) => {
      localStorage.clear();
      if (complete) localStorage.setItem(key, "complete");
    },
    { key: onboardingKey, complete: !onboarding }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page
    .locator("label")
    .filter({ hasText: `${theme === "dark" ? "Dark" : "Light"} theme` })
    .click();
  if (onboarding) await page.locator("[data-onboarding]").waitFor();
  return { context, page };
}

async function captureRoot(filename, width, height, theme) {
  const { context, page } = await openPage(width, height, theme);
  await page.screenshot({ path: `${output}/${filename}`, fullPage: true });
  await context.close();
}

await captureRoot("launch-dark-1440.png", 1440, 1000, "dark");
await captureRoot("launch-light-1440.png", 1440, 1000, "light");

for (const [filename, width, height] of [
  ["onboarding-dark-1440.png", 1440, 1000],
  ["onboarding-mobile-375.png", 375, 812],
]) {
  const { context, page } = await openPage(width, height, "dark", true);
  await page.screenshot({ path: `${output}/${filename}` });
  await context.close();
}

{
  const { context, page } = await openPage(1100, 850);
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Search commands" }).waitFor();
  await page.screenshot({ path: `${output}/command-palette-dark.png` });
  await context.close();
}

async function openWorkspace(filename, width, height, query) {
  const { context, page } = await openPage(width, height);
  await page.getByRole("button", { name: "Open command palette" }).click();
  await page.getByRole("combobox", { name: "Search commands" }).fill(query);
  await page.getByRole("option").filter({ hasText: query }).first().click();
  await page
    .getByRole("heading", {
      name: query === "Open Help" ? "Help Center" : "Data Management",
    })
    .waitFor();
  await page.screenshot({ path: `${output}/${filename}` });
  await context.close();
}

await openWorkspace("help-dark-1440.png", 1440, 1000, "Open Help");
await openWorkspace("help-mobile-375.png", 375, 812, "Open Help");
await openWorkspace(
  "data-management-dark.png",
  1200,
  900,
  "Open Data Management"
);

async function openBakingDay(width, height) {
  const opened = await openPage(width, height);
  const { page } = opened;
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  const enable = page.getByRole("button", { name: "Enable fermentation plan" });
  await enable.waitFor();
  await enable.click();
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  await page.locator("[data-current-task]").waitFor();
  return opened;
}

{
  const { context, page } = await openBakingDay(375, 812);
  await page.getByRole("button", { name: "Prepare for Offline Use" }).click();
  await page
    .getByRole("button", { name: "Prepared for Offline Use" })
    .waitFor({ timeout: 20_000 });
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", {
      configurable: true,
      get: () => false,
    });
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Offline · local work stays available").waitFor();
  await page.screenshot({
    path: `${output}/offline-baking-day-mobile.png`,
  });
  await context.setOffline(false);
  await context.close();
}

{
  const { context, page } = await openPage(1100, 760);
  await page.goto(`${baseURL}/this-screen-does-not-exist`, {
    waitUntil: "networkidle",
  });
  await page.screenshot({ path: `${output}/error-state-dark.png` });
  await context.close();
}

{
  const { context, page } = await openBakingDay(812, 375);
  await page.screenshot({ path: `${output}/baking-day-landscape.png` });
  await context.close();
}

await browser.close();
