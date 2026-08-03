import { z } from "zod";

/**
 * Environment parsing. Every field is optional or defaulted on purpose: a
 * missing variable should never break a build. Tighten a field to required
 * only once the app genuinely cannot run without it.
 *
 * `process.env.NEXT_PUBLIC_*` must be referenced by its full literal name for
 * Next.js to inline it into the client bundle — destructuring `process.env`
 * silently yields `undefined` in the browser.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.warn(
    "[env] Invalid environment variables, falling back to defaults:",
    z.flattenError(parsed.error).fieldErrors
  );
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
