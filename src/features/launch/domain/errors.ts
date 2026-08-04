export type NormalizedError = { title: string; message: string };

export function normalizeProductionError(error: unknown): NormalizedError {
  if (error instanceof Error && error.name === "ChunkLoadError")
    return {
      title: "This workspace needs a fresh copy",
      message:
        "Reload this screen to load the latest application files. Your browser-saved recipes are not removed.",
    };
  return {
    title: "This screen could not finish loading",
    message:
      "Reload this screen or return to the calculator. Saved recipes and Baking Day data remain in this browser.",
  };
}
