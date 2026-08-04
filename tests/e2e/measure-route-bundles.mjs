import { chromium } from "@playwright/test";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const baseURL = "http://127.0.0.1:3000";
const chunksDirectory =
  "/home/lumindae/dev/pizza-dough-calc/.next/static/chunks";

async function fileSizes(filename) {
  const contents = await readFile(join(chunksDirectory, filename));
  return {
    filename,
    raw: contents.byteLength,
    gzip: gzipSync(contents, { level: 9 }).byteLength,
    brotli: brotliCompressSync(contents).byteLength,
  };
}

const browser = await chromium.launch();
const routes = {};
for (const route of ["/", "/bake"]) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  const filenames = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter(
        (name) => name.includes("/_next/static/chunks/") && name.endsWith(".js")
      )
      .map((name) => new URL(name).pathname.split("/").at(-1))
  );
  const sizes = await Promise.all([...new Set(filenames)].map(fileSizes));
  routes[route] = {
    chunks: sizes,
    total: sizes.reduce(
      (total, size) => ({
        raw: total.raw + size.raw,
        gzip: total.gzip + size.gzip,
        brotli: total.brotli + size.brotli,
      }),
      { raw: 0, gzip: 0, brotli: 0 }
    ),
  };
  await context.close();
}
await browser.close();

const allChunks = await readdir(chunksDirectory);
const largest = (
  await Promise.all(
    allChunks.filter((name) => name.endsWith(".js")).map(fileSizes)
  )
)
  .sort((left, right) => right.raw - left.raw)
  .slice(0, 5);

console.log(JSON.stringify({ routes, largest }, null, 2));
