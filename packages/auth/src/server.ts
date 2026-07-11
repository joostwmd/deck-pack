import { createAppAuth, createOpsAuth } from "./index";
import { createDb } from "@deck-pack/db";
import { sendOtpEmail } from "@deck-pack/email";
import { env } from "@deck-pack/env/server";

const db = createDb();

const authDeps = {
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS,
  sendOtp: async ({ email, otp, type }: { email: string; otp: string; type: any }) => {
    await sendOtpEmail({ to: email, otp, type });
  },
  ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
    ? {
        microsoftOAuth: {
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
        },
      }
    : {}),
};

export const opsAuth = createOpsAuth(authDeps);
export const appAuth = createAppAuth(authDeps);
