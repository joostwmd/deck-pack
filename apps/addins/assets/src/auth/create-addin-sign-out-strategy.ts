import {
  MsalNestableTokenCache,
  NoOpSessionContinuityStore,
  createSignOutStrategy,
  type SignOutStrategy,
} from "@deck-pack/auth/microsoft-sign-in";
import type { MicrosoftSignInHost } from "@deck-pack/auth/microsoft-sign-in";
import type { AuthClient } from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

import { clearBearerToken } from "@/auth/bearer-session-store";
import { sessionContinuityStore } from "@/auth/session-continuity-store";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";
import { getAuthClient } from "@/utils/auth";

const microsoftTokenCache = new MsalNestableTokenCache();

export function createAddinSignOutStrategy(options?: {
  host?: MicrosoftSignInHost;
  authClient?: AuthClient;
}): SignOutStrategy {
  const host = options?.host ?? (useOfficeBearerMode() ? "office" : "web");
  const authClient = options?.authClient ?? getAuthClient();

  if (host === "office") {
    const clientId = env.VITE_MICROSOFT_CLIENT_ID;
    if (!clientId) {
      throw new Error("VITE_MICROSOFT_CLIENT_ID is required for Office sign-out.");
    }

    return createSignOutStrategy({
      host: "office",
      authClient,
      bearerStore: { clear: clearBearerToken },
      continuityStore: sessionContinuityStore,
      microsoftTokenCache,
      clientId,
    });
  }

  return createSignOutStrategy({
    host: "web",
    authClient,
    continuityStore: new NoOpSessionContinuityStore(),
  });
}
