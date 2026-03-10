import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/e2e/**",
      "**/guest-experience/**",
      "**/operational-efficiency/**",
      "**/templates/**"  // Playwright/complex tests
    ],
    setupFiles: ["./tests/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
