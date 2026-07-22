import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "vitest/projects/unit-node.config.ts",
      "vitest/projects/unit-jsdom.config.ts",
      "vitest/projects/integration.config.ts",
    ],
  },
});
