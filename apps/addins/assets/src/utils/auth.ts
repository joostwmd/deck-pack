import {
  createAuthClient as createDeckpackAuthClient,
  type AuthClient,
} from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

import {
  clearBearerToken,
  getBearerToken,
  setBearerToken,
} from "@/auth/bearer-session-store";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";

let authClientInstance: AuthClient | null = null;

export function createAuthClient(): AuthClient {
  const useBearerSession = useOfficeBearerMode();

  authClientInstance = createDeckpackAuthClient({
    baseURL: env.VITE_SERVER_URL,
    bearer: useBearerSession
      ? {
          getToken: getBearerToken,
          setToken: setBearerToken,
          clearToken: clearBearerToken,
        }
      : undefined,
  });

  return authClientInstance;
}

export function getAuthClient(): AuthClient {
  if (!authClientInstance) {
    return createAuthClient();
  }

  return authClientInstance;
}

/** @deprecated Prefer getAuthClient(); kept for modules imported after bootstrap. */
export const authClient = new Proxy({} as AuthClient, {
  get(_target, property, receiver) {
    return Reflect.get(getAuthClient(), property, receiver);
  },
});

export function clearAddinAuthSession(): void {
  if (useOfficeBearerMode()) {
    clearBearerToken();
  }
}
