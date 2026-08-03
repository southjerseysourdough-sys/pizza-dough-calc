import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Named .mts so Vite loads it as ESM without requiring "type": "module" in
// package.json, which would change how Next.js resolves its own config.
export default defineConfig({
  resolve: {
    // Native replacement for vite-tsconfig-paths; resolves the "@/*" alias
    // straight from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    projects: [
      // Domain math is framework independent, so it runs in plain Node —
      // no DOM, no React, and noticeably faster.
      {
        extends: true,
        test: {
          name: "domain",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      // Component tests opt into jsdom by using a .test.tsx extension.
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/features/**/domain/**", "src/features/**/utils/**"],
    },
  },
});
