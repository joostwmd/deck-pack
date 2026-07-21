import { createAuth } from "./index";
import { createDb } from "@deck-pack/db";
import { sendOtpEmail, sendOrganizationInvitationEmail } from "./email";
import { env } from "@deck-pack/env/server";

const db = createDb();

const authDeps = {
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGINS,
  portalAppUrl: env.PORTAL_APP_URL,
  adminEmailDomain: env.OPS_SIGNUP_EMAIL_DOMAIN,
  opsOrigins: env.OPS_ORIGINS,
  sendOtp: async ({
    email,
    otp,
    type,
  }: {
    email: string;
    otp: string;
    type: Parameters<typeof sendOtpEmail>[0]["type"];
  }) => {
    await sendOtpEmail({ to: email, otp, type });
  },
  sendOrganizationInvitation: sendOrganizationInvitationEmail,
  ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
    ? {
        microsoftOAuth: {
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = createAuth(authDeps);
