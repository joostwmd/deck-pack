import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    /** Microsoft Entra application (client) ID for add-in NAA; must match API MICROSOFT_CLIENT_ID. */
    VITE_MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
