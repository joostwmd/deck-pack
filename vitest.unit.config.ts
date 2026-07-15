import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/** Fast unit specs only (no Postgres). */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "apps/addins/assets/src"),
    },
  },
  test: {
    name: "unit",
    root: ".",
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts", "**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: false,
  },
});
