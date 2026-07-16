import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(storybookDir, "../../..");
const assetsSrc = path.resolve(repoRoot, "apps/addins/assets/src");

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-mcp"
  ],
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: [
          {
            find: "@deck-pack/env/web",
            replacement: path.resolve(storybookDir, "../stories/assets/mocks/env.ts"),
          },
          {
            find: "@/utils/auth",
            replacement: path.resolve(storybookDir, "../stories/assets/mocks/auth.ts"),
          },
          {
            find: "@/utils/trpc",
            replacement: path.resolve(storybookDir, "../stories/assets/mocks/trpc.ts"),
          },
          {
            find: /^@\/(.*)/,
            replacement: `${assetsSrc}/$1`,
          },
        ],
      },
      envDir: path.resolve(repoRoot, "apps/addins/assets"),
      css: {
        postcss: {
          plugins: [],
        },
      },
    });
  },
};

export default config;
