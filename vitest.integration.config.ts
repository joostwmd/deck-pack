import { defineConfig } from "vitest/config";

/**
 * Hits real Postgres (`DATABASE_URL`; defaults in vitest.integration.global-setup).
 * Scoped to workspaces only — exclude `external/**` and other vendor trees that
 * accidentally match `*.integration.test.ts`.
 */
export default defineConfig({
  test: {
    name: "integration",
    root: ".",
    globalSetup: ["./vitest.integration.global-setup.ts"],
    include: ["apps/**/*.integration.test.ts", "packages/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/external/**"],
    environment: "node",
    fileParallelism: false,
    passWithNoTests: false,
  },
});
