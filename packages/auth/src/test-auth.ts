import { createDb } from "@deck-pack/db";
import { env } from "@deck-pack/env/server";
import type { TestHelpers } from "better-auth/plugins";

import { createAuth, type AuthDeps, type SendOtp, type SendOrganizationInvitation } from "./index";

const noopSendOtp: SendOtp = async () => {};
const noopSendInvitation: SendOrganizationInvitation = async () => {};

export type TestAuth = ReturnType<typeof createAuth>;

/**
 * Test-only Better Auth instance: same schema/secret/cookie prefix as production,
 * plus `testUtils({ captureOTP: true })` for login helpers and OTP capture.
 *
 * Prefer this over hand-rolling session rows + `serializeSignedCookie`.
 * Keep out of production entrypoints (`server.ts`).
 */
export function createTestAuth(overrides: Partial<AuthDeps> = {}): TestAuth {
  const db = overrides.db ?? createDb();

  return createAuth({
    db,
    secret: overrides.secret ?? env.BETTER_AUTH_SECRET,
    baseURL: overrides.baseURL ?? env.BETTER_AUTH_URL,
    trustedOrigins: overrides.trustedOrigins ?? env.CORS_ORIGINS,
    portalAppUrl: overrides.portalAppUrl ?? env.PORTAL_APP_URL,
    adminEmailDomain: overrides.adminEmailDomain ?? env.OPS_SIGNUP_EMAIL_DOMAIN,
    opsOrigins: overrides.opsOrigins ?? env.OPS_ORIGINS,
    sendOtp: overrides.sendOtp ?? noopSendOtp,
    sendOrganizationInvitation: overrides.sendOrganizationInvitation ?? noopSendInvitation,
    microsoftOAuth: overrides.microsoftOAuth,
    enableTestUtils: true,
  });
}

export async function getTestAuthHelpers(overrides: Partial<AuthDeps> = {}): Promise<{
  auth: TestAuth;
  test: TestHelpers;
}> {
  const auth = createTestAuth(overrides);
  const ctx = await auth.$context;
  const test = ctx.test;
  if (!test) {
    throw new Error("createTestAuth: ctx.test missing — testUtils plugin failed to register");
  }
  return { auth, test };
}
