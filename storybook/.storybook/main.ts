import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { mergeConfig } from "vite";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(storybookDir, "..");
const assetsRoot = path.resolve(repoRoot, "apps/addins/assets");
const assetsSrc = path.resolve(assetsRoot, "src");
const fixturesRoot = path.resolve(repoRoot, "fixtures");
const assetsSrcEntry = path.join(assetsSrc, "main.tsx");

/** Fixture modules live at repo root; resolve their deps from the add-in package graph. */
function resolveFixtureDependencies(): Plugin {
  return {
    name: "resolve-fixture-dependencies",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer?.startsWith(`${fixturesRoot}${path.sep}`)) {
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

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)", "../stories/**/*.mdx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [resolveFixtureDependencies(), react(), tailwindcss()],
      resolve: {
        alias: [
          {
            find: "@deck-pack/env/web",
            replacement: path.resolve(storybookDir, "../stories/assets/mocks/env.ts"),
          },
          {
            find: /^@\/(.*)/,
            replacement: `${assetsSrc}/$1`,
          },
          {
            find: "@fixtures",
            replacement: fixturesRoot,
          },
        ],
      },
      server: {
        fs: {
          allow: [repoRoot],
        },
      },
      envDir: path.resolve(assetsRoot),
      css: {
        postcss: {
          plugins: [],
        },
      },
    });
  },
};

export default config;
