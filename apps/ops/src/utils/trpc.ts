import type { AppRouter } from "@deck-pack/api/routers/index";
import { env } from "@deck-pack/env/web";
import { captureClientException } from "@deck-pack/observability";
import { createTrpcBrowserBundle } from "@deck-pack/trpc-client";
import { toast } from "sonner";

export const { queryClient, trpcClient, trpc } = createTrpcBrowserBundle<AppRouter>({
  trpcUrl: `${env.VITE_SERVER_URL}/trpc`,
  onQueryError: (error, query) => {
    captureClientException(error, { tags: { source: "react-query" } });
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
