import type { AppRouter } from "@deck-pack/api/routers/index";
import { env } from "@deck-pack/env/web";
import { captureClientException } from "@deck-pack/observability";
import { createTrpcBrowserBundle } from "@deck-pack/trpc-client";
import { toast } from "sonner";

import { getBearerToken } from "@/auth/bearer-session-store";
import { useOfficeBearerMode } from "@/auth/office-auth-mode";
import { isAuthenticationError } from "@/lib/user-facing-api-error";

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
    onQueryError: (error, query) => {
      if (!isAuthenticationError(error)) {
        captureClientException(error, { tags: { source: "react-query" } });
      }

      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            query.invalidate();
          },
        },
      });
    },
  });

  return trpcBundle;
}

export function getTrpcClient(): ReturnType<typeof createTrpcBrowserBundle<AppRouter>>["trpcClient"] {
  if (!trpcBundle) {
    createTrpcClient();
  }

  return trpcBundle!.trpcClient;
}
