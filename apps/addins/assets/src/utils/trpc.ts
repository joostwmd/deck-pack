import type { AppRouter } from "@deck-pack/api/routers/index";
import { env } from "@deck-pack/env/web";
import { createTrpcBrowserBundle } from "@deck-pack/trpc-client";

export const { trpcClient } = createTrpcBrowserBundle<AppRouter>({
  trpcUrl: `${env.VITE_SERVER_URL}/trpc`,
});
