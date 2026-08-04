import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = "http://127.0.0.1:3000";
const output = "/home/lumindae/dev/pizza-dough-calc/docs/screenshots";
const sessionKey = "sjs:pizza-dough-calculator:baking-session:v1";

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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page
    .locator("label")
    .filter({ hasText: `${theme === "dark" ? "Dark" : "Light"} theme` })
    .click();
  return { context, page };
}

async function enablePlanner(page) {
  await page.getByRole("button", { name: "Open fermentation planner" }).click();
  await page.getByRole("button", { name: "Enable fermentation plan" }).click();
  await page.getByText("Weigh ingredients", { exact: true }).waitFor();
}

for (const [filename, width, height, theme] of [
  ["fermentation-planner-dark-1440.png", 1440, 1000, "dark"],
  ["fermentation-planner-dark-768.png", 768, 1024, "dark"],
  ["fermentation-planner-mobile-430.png", 430, 932, "dark"],
  ["fermentation-planner-mobile-375.png", 375, 812, "dark"],
  ["fermentation-planner-light-1440.png", 1440, 1000, "light"],
]) {
  const { context, page } = await openPage(width, height, theme);
  await enablePlanner(page);
  await page.screenshot({ path: `${output}/${filename}`, fullPage: true });
  await context.close();
}

async function openBakingDay(width, height, sheetPan = false) {
  const opened = await openPage(width, height, "dark");
  const { page } = opened;
  if (sheetPan)
    await page.locator("label").filter({ hasText: "Sheet pan" }).click();
  await enablePlanner(page);
  await page.getByRole("button", { name: "Start Baking Day" }).click();
  await page.locator("[data-current-task]").waitFor();
  return opened;
}

async function setStage(page, stageId) {
  await page.evaluate(
    ({ key, id }) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const session = JSON.parse(raw);
      session.currentStageId = id;
      session.stages[id] = {
        ...(session.stages[id] ?? {}),
        status: "active",
        actualStartedAt: new Date().toISOString(),
      };
      session.timer = undefined;
      session.timerStageId = undefined;
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: sessionKey, id: stageId }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-current-task]").waitFor();
}

{
  const { context, page } = await openBakingDay(1440, 1000);
  await setStage(page, "mix");
  await page.screenshot({
    path: `${output}/baking-day-mix-dark-1440.png`,
    fullPage: true,
  });
  await context.close();
}

{
  const { context, page } = await openBakingDay(375, 812);
  await setStage(page, "mix");
  await page.screenshot({ path: `${output}/baking-day-mix-mobile-375.png` });
  await context.close();
}

{
  const { context, page } = await openBakingDay(375, 812);
  await setStage(page, "fold-1");
  await page.getByRole("button", { name: "Start timer" }).click();
  await page.screenshot({ path: `${output}/baking-day-fold-timer-mobile.png` });
  await context.close();
}

{
  const { context, page } = await openBakingDay(375, 812, true);
  await setStage(page, "pan");
  await page.screenshot({ path: `${output}/baking-day-sheet-pan-mobile.png` });
  await context.close();
}

{
  const { context, page } = await openBakingDay(1440, 1000);
  await page.getByRole("button", { name: "End Baking Day session" }).click();
  await page.screenshot({
    path: `${output}/baking-day-complete-dark.png`,
    fullPage: true,
  });
  await context.close();
}

await browser.close();
