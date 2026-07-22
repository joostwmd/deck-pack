import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    /** Portal web app origin (ops → portal after impersonate). */
    VITE_PORTAL_URL: z.url(),
    /** Ops dashboard origin (portal → ops after stop impersonating). */
    VITE_OPS_URL: z.url(),
    /** Browser Sentry DSN; omit to disable client error reporting. */
    VITE_SENTRY_DSN: z.string().min(1).optional(),
    /** Microsoft Entra application (client) ID for add-in NAA; must match API MICROSOFT_CLIENT_ID. */
    VITE_MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
