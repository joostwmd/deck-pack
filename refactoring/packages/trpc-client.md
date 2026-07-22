# `packages/trpc-client` — infra package, no change needed

Kind: **infra**. Lowest priority in this whole refactor — this package is a single, well-scoped factory function with no state to hide behind class methods, so there's no OOP conversion to make here. Documented for completeness (`00-conventions-and-architecture.md`'s "more is less" instruction), not because anything needs to change.

## Current state (confirmed, in full)

```
packages/trpc-client/src/
  index.ts    — createTrpcBrowserBundle<TRouter>(options) — the only export
```

```typescript
export type CreateTrpcBrowserBundleOptions = {
  trpcUrl: string;
  credentials?: RequestCredentials;
  getAuthorizationHeader?: () => string | null;
  onQueryError?: TrpcQueryCacheErrorHandler;
};

export function createTrpcBrowserBundle<TRouter extends AnyRouter>(options: CreateTrpcBrowserBundleOptions) {
  const queryClient = new QueryClient({ queryCache: new QueryCache({ onError: (error, query) => options.onQueryError?.(error, query) }) });
  const trpcClient = createTRPCClient<TRouter>({ links: [httpBatchLink({ url: options.trpcUrl, transformer: superjson, fetch: /* injects Authorization header + credentials */ })] });
  const trpc = createTRPCOptionsProxy<TRouter>({ client: trpcClient, queryClient });
  return { queryClient, trpcClient, trpc };
}
```

## Why this stays a function, not a class

A class would need to expose the exact same three values (`queryClient`, `trpcClient`, `trpc`) as either public fields or getters — there's no internal mutable state, no method that changes behavior based on prior calls, and no polymorphism need (nothing implements an interface this could vary behind). Converting it to a class would be ceremony with no payoff, which is exactly the case `00-conventions-and-architecture.md` §8.1's "not every package is the same kind of thing" principle is there to prevent — forcing OOP where a factory function is already the right amount of structure.

## Target file tree

Unchanged.

## Design patterns implemented here, and what each solves

| Pattern              | File(s)                   | Problem solved                                                                                                                                                                                                    |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Factory function** | `createTrpcBrowserBundle` | Bundles three interdependent objects (`QueryClient`, tRPC client, tRPC options proxy) that must be constructed together and always used as a set, returned as one object so every app constructs them identically |

## Migration order

None. Every app (`portal`, `ops`, `addins`) continues calling `createTrpcBrowserBundle` exactly as today; only the `AppRouter` type it's generic over changes shape as backend domains move into packages (the type, not this package's code).
