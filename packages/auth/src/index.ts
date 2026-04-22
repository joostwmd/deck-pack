import { createDb } from "@deck-pack/db";
import * as schema from "@deck-pack/db/schema/auth";
import { env } from "@deck-pack/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { sendOtpEmail } from "@deck-pack/email";

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
  });
}

export const auth = createAuth();
