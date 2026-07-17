import type { AppRouter } from "@deck-pack/api/routers/index";
import { env } from "@deck-pack/env/web";
import { createTrpcBrowserBundle } from "@deck-pack/trpc-client";

import { getBearerToken } from "@/auth/bearer-session-store";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";

let trpcBundle: ReturnType<typeof createTrpcBrowserBundle<AppRouter>> | null = null;

export function createTrpcClient(): ReturnType<typeof createTrpcBrowserBundle<AppRouter>> {
  const useBearerSession = useOfficeBearerMode();

  trpcBundle = createTrpcBrowserBundle<AppRouter>({
    trpcUrl: `${env.VITE_SERVER_URL}/trpc`,
    credentials: useBearerSession ? "omit" : "include",
    getAuthorizationHeader: useBearerSession
      ? () => {
          const token = getBearerToken();
          return token ? `Bearer ${token}` : null;
        }
      : undefined,
  });

  return trpcBundle;
}

export function getTrpcClient(): ReturnType<typeof createTrpcBrowserBundle<AppRouter>>["trpcClient"] {
  if (!trpcBundle) {
    createTrpcClient();
  }

  return trpcBundle!.trpcClient;
}
