import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import * as devCerts from "office-addin-dev-certs";
import { defineConfig } from "vite";

async function getHttpsOptions() {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  try {
    const httpsOptions = await devCerts.getHttpsServerOptions();

    return {
      ca: httpsOptions.ca,
      key: httpsOptions.key,
      cert: httpsOptions.cert,
    };
  } catch (error) {
    console.warn("Failed to get HTTPS options:", error);

    return {};
  }
}

export default defineConfig(async () => {
  const httpsOptions = await getHttpsOptions();

  return {
    server: {
      ...(process.env.NODE_ENV !== "production" && { https: httpsOptions }),
      port: 3003,
      strictPort: true,
      proxy: {
        // Proxy API calls through the HTTPS dev server so the add-in (HTTPS)
        // never makes mixed-content requests to the HTTP API (localhost:3000).
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        "/trpc": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      ...(process.env.NODE_ENV !== "production" && { https: httpsOptions }),
      port: 3003,
      strictPort: true,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
    ],
  };
});
