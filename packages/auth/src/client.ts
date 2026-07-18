import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { ac, organizationOwner, organizationAdmin, organizationMember } from "./utils/rbac";

export type BearerSessionStore = {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
};

export type AppAuthClientOptions = {
  baseURL: string;
  /** When provided, auth requests carry a Better Auth bearer session (Office add-in). */
  bearer?: BearerSessionStore;
};

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

export function captureBearerTokenFromResponse(
  store: BearerSessionStore,
  response: Response,
): void {
  const headerToken = response.headers.get("set-auth-token");
  if (headerToken) {
    store.setToken(headerToken);
  }
}

/**
 * Browser client for customer-facing apps — portal, addins, etc. (`/api/auth/app`).
 */
export function createAppAuthClient(config: AppAuthClientOptions) {
  const { baseURL, bearer: bearerStore } = config;

  return createReactAuthClient({
    baseURL,
    basePath: "/api/auth/app",
    plugins: [
      emailOTPClient(),
      organizationClient({
        ac,
        roles: { organizationOwner, organizationAdmin, organizationMember },
      }),
    ],
    fetchOptions: bearerStore
      ? {
          auth: {
            type: "Bearer",
            token: () => bearerStore.getToken() ?? "",
          },
          onSuccess: (ctx) => {
            captureBearerTokenFromResponse(bearerStore, ctx.response);
          },
        }
      : undefined,
  });
}
