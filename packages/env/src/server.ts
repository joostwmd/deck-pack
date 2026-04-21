import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const commaSeparatedUrls = z
  .string()
  .min(1)
  .transform((raw) =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

export const env = createEnv({
  server: {
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    /** Comma-separated list of browser origins (e.g. Static Web Apps URLs). */
    CORS_ORIGINS: commaSeparatedUrls,
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
