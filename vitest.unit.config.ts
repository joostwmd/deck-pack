import { defineConfig } from "vitest/config";

/** Fast unit specs only (no Postgres). */
export default defineConfig({
  test: {
    name: "unit",
    root: ".",
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts", "**/node_modules/**", "**/dist/**"],
    environment: "node",
    passWithNoTests: false,
  },
});
