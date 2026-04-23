import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { ac, organizationOwner, organizationAdmin, organizationMember } from "./utils/rbac";

/**
 * Browser client for Vite / React. Uses `better-auth/react` so `useSession` is a real hook.
 * The vanilla `better-auth/client` build exposes session as a Nano Store atom, not a React hook.
 */
export function createAuthClient(config: { baseURL: string }) {
  return createReactAuthClient({
    baseURL: config.baseURL,
    plugins: [
      emailOTPClient(),
      adminClient(),
      organizationClient({
        ac,
        roles: { organizationOwner, organizationAdmin, organizationMember },
      }),
    ],
  });
}
