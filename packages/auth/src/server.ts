import { createAuth } from "./index";
import { createDb } from "@deck-pack/db";
import { sendOtpEmail } from "@deck-pack/email";
import { env } from "@deck-pack/env/server";

const db = createDb();

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS,
  sendOtp: async ({ email, otp, type }) => {
    await sendOtpEmail({ to: email, otp, type });
  },
});
