import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const assetsRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(assetsRoot, "../../..");
const addinTestsRoot = path.resolve(repoRoot, "tests/addins/assets");
const assetsSrcEntry = path.join(assetsRoot, "src/main.tsx");

/** Bare imports from repo-root tests must resolve against the add-in package graph. */
function resolveFromAssetsNodeModules(): Plugin {
  return {
    name: "resolve-from-assets-node-modules",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer?.includes(`${path.sep}tests${path.sep}addins${path.sep}assets${path.sep}`)) {
        return null;
      }

      if (source.startsWith(".") || source.startsWith("\0") || source.startsWith("/")) {
        return null;
      }

      if (source.startsWith("@/") || source.startsWith("@fixtures")) {
        return null;
      }

      return this.resolve(source, assetsSrcEntry, {
        ...options,
        skipSelf: true,
      });
    },
  };
}

export default defineConfig({
  root: assetsRoot,
  plugins: [
    resolveFromAssetsNodeModules(),
    react({
      include: [
        /\/apps\/addins\/assets\/src\/.*\.[jt]sx$/,
        /\/tests\/addins\/assets\/.*\.[jt]sx$/,
      ],
    }),
  ] as import("vitest/config").UserConfig["plugins"],
  resolve: {
    alias: [
      { find: "@fixtures", replacement: path.resolve(repoRoot, "fixtures") },
      { find: /^@\/(.*)/, replacement: `${path.resolve(assetsRoot, "src")}/$1` },
    ],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  test: {
    environment: "jsdom",
    deps: {
      moduleDirectories: [
        path.join(assetsRoot, "node_modules"),
        path.join(repoRoot, "node_modules"),
      ],
    },
    include: [
      path.join(addinTestsRoot, "**/*.test.ts"),
      path.join(addinTestsRoot, "**/*.test.tsx"),
    ],
  },
  esbuild: {
    jsx: "automatic",
  },
});
