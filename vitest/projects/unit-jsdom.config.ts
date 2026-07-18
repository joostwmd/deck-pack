import { createRequire } from "node:module";
import path from "node:path";

import { defineConfig } from "vitest/config";

import {
  assetsRoot,
  createAddinAliases,
  createDeckPackAliases,
  createWorkspaceResolvePlugins,
  repoRoot,
  resolveFromAssetsNodeModules,
} from "../shared";

const require = createRequire(path.join(assetsRoot, "package.json"));
const react = require("@vitejs/plugin-react").default;

/** jsdom unit tests: React hooks/components (add-in + observability). */
export default defineConfig({
  envDir: assetsRoot,
  plugins: [
    resolveFromAssetsNodeModules(),
    react({
      include: [
        /\/apps\/addins\/assets\/src\/.*\.[jt]sx$/,
        /\/tests\/addins\/assets\/.*\.[jt]sx$/,
        /\/packages\/observability\/src\/.*\.[jt]sx$/,
        /\/tests\/packages\/observability\/.*\.[jt]sx$/,
      ],
    }),
    ...createWorkspaceResolvePlugins(),
  ],
  resolve: {
    alias: [...createDeckPackAliases(), ...createAddinAliases()],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  test: {
    name: "unit-jsdom",
    root: repoRoot,
    environment: "jsdom",
    include: [
      "tests/addins/**/*.test.ts",
      "tests/addins/**/*.test.tsx",
      "tests/packages/observability/**/*.test.ts",
      "tests/packages/observability/**/*.test.tsx",
    ],
    passWithNoTests: false,
    deps: {
      moduleDirectories: [
        path.join(assetsRoot, "node_modules"),
        path.join(repoRoot, "node_modules"),
      ],
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
