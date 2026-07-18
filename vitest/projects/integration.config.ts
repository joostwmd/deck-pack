import path from "node:path";

import { defineConfig } from "vitest/config";

import { createDeckPackAliases, createWorkspaceResolvePlugins, repoRoot } from "../shared";

/** Integration tests: Postgres + bearer API transport. */
export default defineConfig({
  plugins: createWorkspaceResolvePlugins(),
  resolve: {
    alias: createDeckPackAliases(),
  },
  test: {
    name: "integration",
    root: repoRoot,
    globalSetup: [path.join(repoRoot, "tests/setup/integration-env.ts")],
    include: ["tests/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/external/**"],
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    passWithNoTests: false,
    server: {
      deps: {
        inline: [/@deck-pack\/.*/],
      },
    },
  },
});
