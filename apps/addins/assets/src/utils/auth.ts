import { createAppAuthClient } from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

import {
  clearBearerToken,
  getBearerToken,
  setBearerToken,
} from "@/auth/bearer-session-store";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";

let authClientInstance: ReturnType<typeof createAppAuthClient> | null = null;

export function createAuthClient(): ReturnType<typeof createAppAuthClient> {
  const useBearerSession = useOfficeBearerMode();

  authClientInstance = createAppAuthClient({
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

export function getAuthClient(): ReturnType<typeof createAppAuthClient> {
  if (!authClientInstance) {
    return createAuthClient();
  }

  return authClientInstance;
}

/** @deprecated Prefer getAuthClient(); kept for modules imported after bootstrap. */
export const authClient = new Proxy({} as ReturnType<typeof createAppAuthClient>, {
  get(_target, property, receiver) {
    return Reflect.get(getAuthClient(), property, receiver);
  },
});

export function clearAddinAuthSession(): void {
  if (useOfficeBearerMode()) {
    clearBearerToken();
  }
}
