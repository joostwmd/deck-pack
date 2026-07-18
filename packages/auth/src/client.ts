import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { ac, organizationOwner, organizationAdmin, organizationMember } from "./utils/rbac";

export type BearerSessionStore = {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
};

export type AuthClientOptions = {
  baseURL: string;
  /** When provided, auth requests carry a Better Auth bearer session (Office add-in). */
  bearer?: BearerSessionStore;
};

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
 * Browser client for all DeckPack frontends (ops, portal, add-in).
 */
export function createAuthClient(config: AuthClientOptions) {
  const { baseURL, bearer: bearerStore } = config;

  return createReactAuthClient({
    baseURL,
    basePath: "/api/auth",
    plugins: [
      emailOTPClient(),
      adminClient(),
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

export type AuthClient = ReturnType<typeof createAuthClient>;
