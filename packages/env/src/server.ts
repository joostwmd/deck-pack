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
    /** Ops dashboard origins; OTP soft-gate applies when sign-in Origin matches. */
    OPS_ORIGINS: commaSeparatedUrls,
    /** Emails ending with @<domain> are promoted to platform admin on sign-up. */
    OPS_SIGNUP_EMAIL_DOMAIN: z.string().min(1).default("code.berlin"),
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
    /** Microsoft Entra app registration; both required to enable Microsoft OAuth on app auth. */
    MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
    MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
    /** Pexels API key for stock photo search in the assets add-in. */
    PEXELS_API_KEY: z.string().min(1),
    /** Azure Blob account for library uploads; omit until storage is wired. */
    AZURE_STORAGE_ACCOUNT_NAME: z.string().min(1).optional(),
    /** Private blob container name (e.g. uploads). */
    AZURE_STORAGE_CONTAINER: z.string().min(1).optional(),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
