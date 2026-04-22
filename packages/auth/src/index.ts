import { createDb } from "@deck-pack/db";
import * as schema from "@deck-pack/db/schema/auth";
import { env } from "@deck-pack/env/server";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { sendOtpEmail } from "@deck-pack/email";
import { createAuthMiddleware } from "better-auth/api";

const ADMIN_EMAIL_DOMAIN = "code.berlin";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: env.CORS_ORIGINS,
    emailAndPassword: {
      enabled: false,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
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
          if (type === "sign-in") {
            // Send the OTP for sign in
            await sendOtpEmail({
              to: email,
              otp,
              type,
            });
          } else if (type === "email-verification") {
            // Send the OTP for email verification
            await sendOtpEmail({
              to: email,
              otp,
              type,
            });
          } else if (type === "forget-password") {
            // Send the OTP for password reset
            await sendOtpEmail({
              to: email,
              otp,
              type,
            });
          }
        },
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Intercept email-otp sendVerificationOTP endpoint
        if (ctx.path === "/email-otp/send-verification-otp") {
          const email = ctx.body?.email as string;
          if (!email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
            throw new APIError("BAD_REQUEST", {
              message: `Email must use the @${ADMIN_EMAIL_DOMAIN} domain.`,
            });
          }
        }
        // Intercept sign-in with OTP (new registrations happen here)
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
  });
}

export const auth = createAuth();
