import type { createAppAuthClient } from "@deck-pack/auth/client";
import { env } from "@deck-pack/env/web";

import { getBearerToken } from "@/auth/bearer-session-store";
import { acquireMicrosoftTokensSilently } from "@/auth/microsoft-naa";
import { isNaaSupported } from "@/auth/naa-support";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";

type AppAuthClient = ReturnType<typeof createAppAuthClient>;

let restoreAttempt: Promise<boolean> | null = null;

/**
 * Silently restores the Better Auth bearer session in the Office task pane.
 *
 * The persisted bearer token can expire between pane openings. When that happens,
 * we re-acquire Microsoft tokens through NAA without any UI (the user is already
 * signed into Office) and mint a fresh Better Auth session. The new bearer token
 * is captured automatically by the auth client's set-auth-token response hook.
 *
 * Returns true when a signed-in session should now be available.
 */
export function restoreOfficeSession(authClient: AppAuthClient): Promise<boolean> {
  // One attempt per task pane lifetime; concurrent callers share the result.
  restoreAttempt ??= attemptRestore(authClient);
  return restoreAttempt;
}

async function attemptRestore(authClient: AppAuthClient): Promise<boolean> {
  if (!useOfficeBearerMode()) return false;
  if (!isNaaSupported()) return false;

  const clientId = env.VITE_MICROSOFT_CLIENT_ID;
  if (!clientId) return false;

  let idToken: string | undefined;
  let accessToken: string | undefined;

  try {
    const result = await acquireMicrosoftTokensSilently(clientId);
    idToken = result.idToken;
    accessToken = result.accessToken;
  } catch {
    return false;
  }

  if (!idToken) return false;

  try {
    const { error } = await authClient.signIn.social({
      provider: "microsoft",
      idToken: {
        token: idToken,
        accessToken,
      },
    });

    if (error) return false;
  } catch {
    return false;
  }

  return getBearerToken() !== null;
}

/** Test-only escape hatch to reset the per-lifetime attempt cache. */
export function resetOfficeSessionRestoreForTests(): void {
  restoreAttempt = null;
}
