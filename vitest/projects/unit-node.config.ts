import { defineConfig } from "vitest/config";

import { createDeckPackAliases, createWorkspaceResolvePlugins, repoRoot } from "../shared";

/** Node unit tests: API, packages, ops — no DOM. */
export default defineConfig({
  plugins: createWorkspaceResolvePlugins(),
  resolve: {
    alias: createDeckPackAliases(),
  },
  test: {
    name: "unit-node",
    root: repoRoot,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: [
      "**/*.integration.test.ts",
      "**/node_modules/**",
      "**/dist/**",
      "tests/addins/**",
      "tests/packages/observability/**",
      "tests/packages/ui/**",
    ],
    environment: "node",
    passWithNoTests: false,
    server: {
      deps: {
        inline: [/@deck-pack\/.*/, /better-auth\//],
      },
    },
  },
});
