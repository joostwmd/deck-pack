import { useApitally } from "apitally/hono";
import type { Hono } from "hono";

import { env } from "@deck-pack/env/server";

import type { AppEnv } from "../../types";

/** Registers Apitally on the root Hono app; no-ops without `APITALLY_CLIENT_ID`. Call immediately after `new Hono()`. */
export function initializeApitally(app: Hono<AppEnv>) {
  if (!env.APITALLY_CLIENT_ID) return;

  /** `useApitally` is typed as bare `Hono`; cast through `unknown` for [`AppEnv`](../../types.ts). */
  const registerApitally = useApitally as unknown as (
    honoApp: Hono<AppEnv>,
    config: Parameters<typeof useApitally>[1],
  ) => void;

  registerApitally(app, {
    clientId: env.APITALLY_CLIENT_ID,
    env: env.APITALLY_ENV,
    requestLogging: {
      enabled: true,
      logRequestHeaders: false,
      logRequestBody: false,
      logResponseHeaders: false,
      logResponseBody: false,
      captureLogs: true,
    },
  });
}
