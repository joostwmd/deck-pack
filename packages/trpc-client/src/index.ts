import type { Query, QueryKey } from "@tanstack/react-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type HTTPBatchLinkOptions } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AnyRouter } from "@trpc/server";

export type TrpcQueryCacheErrorHandler = (
  error: Error,
  query: Query<unknown, unknown, unknown, QueryKey>,
) => void;

export type CreateTrpcBrowserBundleOptions = {
  /** Full tRPC HTTP URL, e.g. `${env.VITE_SERVER_URL}/trpc` */
  trpcUrl: string;
  credentials?: RequestCredentials;
  onQueryError?: TrpcQueryCacheErrorHandler;
};

export function createTrpcBrowserBundle<TRouter extends AnyRouter>(
  options: CreateTrpcBrowserBundleOptions,
) {
  const { trpcUrl, credentials = "include", onQueryError } = options;

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        onQueryError?.(error, query);
      },
    }),
  });

  const trpcClient = createTRPCClient<TRouter>({
    links: [
      httpBatchLink({
        url: trpcUrl,
        fetch(url: string, opts: RequestInit) {
          return fetch(url, {
            ...opts,
            credentials,
          });
        },
      } as unknown as HTTPBatchLinkOptions<TRouter["_def"]["_config"]["$types"]>),
    ],
  });

  const trpc = createTRPCOptionsProxy<TRouter>({
    client: trpcClient,
    queryClient,
  });

  return { queryClient, trpcClient, trpc };
}
