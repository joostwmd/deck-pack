import { defineConfig, devices } from "@playwright/test";

import { seedApiTestEnv } from "./tests/api/test-utils/seed-api-test-env";

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3000";
const OPS_URL = process.env.E2E_OPS_URL ?? "http://127.0.0.1:3001";
const PORTAL_URL = process.env.E2E_PORTAL_URL ?? "http://127.0.0.1:3002";

// Secrets / DB defaults for local runs (does not override CI-provided values).
seedApiTestEnv();

// Force browser↔API origins for E2E. Must assign (not ??=): seedApiTestEnv defaults
// CORS to :5173, and apps/*/.env uses `localhost` which is a different origin than 127.0.0.1.
process.env.E2E_API_URL = API_URL;
process.env.E2E_OPS_URL = OPS_URL;
process.env.E2E_PORTAL_URL = PORTAL_URL;
process.env.BETTER_AUTH_URL = API_URL;
process.env.CORS_ORIGINS = `${OPS_URL},${PORTAL_URL}`;
process.env.OPS_ORIGINS = OPS_URL;
process.env.PORTAL_APP_URL = PORTAL_URL;
process.env.VITE_SERVER_URL = API_URL;
process.env.VITE_PORTAL_URL = PORTAL_URL;
process.env.VITE_OPS_URL = OPS_URL;

const sharedEnv = {
  ...process.env,
  BETTER_AUTH_URL: API_URL,
  CORS_ORIGINS: `${OPS_URL},${PORTAL_URL}`,
  OPS_ORIGINS: OPS_URL,
  PORTAL_APP_URL: PORTAL_URL,
  VITE_SERVER_URL: API_URL,
  VITE_PORTAL_URL: PORTAL_URL,
  VITE_OPS_URL: OPS_URL,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 60_000,
  use: {
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "ops",
      use: { baseURL: OPS_URL },
      testMatch: /ops-.*\.spec\.ts/,
    },
    {
      name: "portal",
      use: { baseURL: PORTAL_URL },
      testMatch: /portal-.*\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: "pnpm -F @deck-pack/api dev",
      url: `${API_URL}/healthz`,
      // Always start fresh so CORS/VITE env from this config is applied.
      reuseExistingServer: false,
      timeout: 120_000,
      env: sharedEnv,
    },
    {
      command: "pnpm -F @deck-pack/ops exec vite --host 127.0.0.1 --port 3001",
      url: OPS_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: sharedEnv,
    },
    {
      command: "pnpm -F @deck-pack/portal exec vite --host 127.0.0.1 --port 3002",
      url: PORTAL_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: sharedEnv,
    },
  ],
});
