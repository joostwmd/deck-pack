import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { ac, organizationOwner, organizationAdmin, organizationMember } from "./utils/rbac";

/**
 * Browser client for the internal ops dashboard (`/api/auth/ops`).
 */
export function createOpsAuthClient(config: { baseURL: string }) {
  return createReactAuthClient({
    baseURL: config.baseURL,
    basePath: "/api/auth/ops",
    plugins: [emailOTPClient(), adminClient()],
  });
}

/**
 * Browser client for customer-facing apps — portal, addins, etc. (`/api/auth/app`).
 */
export function createAppAuthClient(config: { baseURL: string }) {
  return createReactAuthClient({
    baseURL: config.baseURL,
    basePath: "/api/auth/app",
    plugins: [
      emailOTPClient(),
      organizationClient({
        ac,
        roles: { organizationOwner, organizationAdmin, organizationMember },
      }),
    ],
  });
}
