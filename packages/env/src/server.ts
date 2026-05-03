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
    /** Resend API key; required whenever the API sends mail (incl. local dev with OTP). */
    EMAIL_API_KEY: z.string().min(1),
    /** Resend "from" (must be a verified sender in Resend). */
    EMAIL_FROM: z.string().min(1),
    /** Server-side Sentry DSN; omit to disable Sentry. */
    SENTRY_DSN: z.string().min(1).optional(),
    /** Apitally client id; omit to skip Apitally middleware. */
    APITALLY_CLIENT_ID: z.string().min(1).optional(),
    /** Apitally environment label (dashboards). */
    APITALLY_ENV: z.enum(["dev", "staging", "prod"]).default("dev"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
