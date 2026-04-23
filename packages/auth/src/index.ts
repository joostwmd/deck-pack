import type { createDb } from "@deck-pack/db";
import * as schema from "@deck-pack/db/schema/auth";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";

const ADMIN_EMAIL_DOMAIN = "code.berlin";

export type AuthDb = ReturnType<typeof createDb>;

export type OtpEmailType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export type SendOtp = (args: { email: string; otp: string; type: OtpEmailType }) => Promise<void>;

export interface AuthDeps {
  db: AuthDb;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  sendOtp: SendOtp;
}

/**
 * Pure factory — takes everything it needs as arguments so it can also be
 * called from a schema-generation context with fakes/placeholders.
 *
 * No module-level imports touch env, so importing this file does not trigger
 * `@deck-pack/env` validation.
 */
export function createAuth(deps: AuthDeps) {
  const { db, secret, baseURL, trustedOrigins, sendOtp } = deps;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins,
    secret,
    baseURL,
    emailAndPassword: {
      enabled: false,
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtp({ email, otp, type });
        },
      }),
      admin({
        impersonationSessionDuration: 1000 * 60 * 60 * 24 * 30,
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/email-otp/send-verification-otp") {
          const email = ctx.body?.email as string;
          if (!email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
            throw new APIError("BAD_REQUEST", {
              message: `Email must use the @${ADMIN_EMAIL_DOMAIN} domain.`,
            });
          }
        }
        if (ctx.path === "/sign-in/email-otp") {
          const email = ctx.body?.email as string;
          if (!email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
            throw new APIError("BAD_REQUEST", {
              message: `Email must use the @${ADMIN_EMAIL_DOMAIN} domain.`,
            });
          }
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user, ctx) => {
            if (user.email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
              console.log("promoting to admin", user.id);
              await ctx?.context.adapter.update({
                model: "user",
                where: [{ field: "id", value: user.id }],
                update: {
                  role: "admin",
                },
              });
            }
          },
        },
      },
    },
  });
}
