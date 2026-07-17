import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const assetsRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()] as import("vitest/config").UserConfig["plugins"],
  resolve: {
    alias: {
      "@": path.resolve(assetsRoot, "src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
