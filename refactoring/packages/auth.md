# `packages/auth` — infra package (largely already compliant — read this as the _model_, not a rewrite target)

Kind: **infra**. This package is the single strongest existing precedent for the entire target architecture — it's already class-based, already uses the Strategy pattern with a factory function choosing the implementation, and already has the right instinct (constructor injection of `AuthClient`/`BearerTokenStore`/etc.). Most other packages are being changed _to look like this one_. Document it accurately, change little.

## Current state (confirmed)

```
packages/auth/src/
  index.ts
  client.ts                          — AuthClient (Better Auth client wrapper)
  server.ts                           — Better Auth server instance + config
  schema.ts
  permissions.ts
  rbac.ts
  workspace.ts
  email.ts
  session-cookie.ts
  session-continuity.ts
  continuity-aware-sign-in.ts
  microsoft-sign-in.ts
  microsoft-sign-in-strategy.ts        — MicrosoftSignInStrategy interface + WebMicrosoftSignInStrategy + factory
  microsoft-sign-in-availability.ts
  microsoft-naa.ts
  microsoft-id-token.ts
  microsoft-token-cache.ts
  sign-out-strategy.ts                  — SignOutStrategy interface + WebCookieSignOutStrategy + OfficeBearerSignOutStrategy + factory
  ops-soft-gate.ts
  utils/
```

## The pattern already present — `sign-out-strategy.ts` in full

```typescript
export interface SignOutStrategy {
  signOut(): Promise<void>;
}

export class WebCookieSignOutStrategy implements SignOutStrategy {
  constructor(private readonly authClient: AuthClient) {}
  async signOut(): Promise<void> {
    await this.authClient.signOut();
  }
}

export class OfficeBearerSignOutStrategy implements SignOutStrategy {
  constructor(
    private readonly authClient: AuthClient,
    private readonly bearerStore: BearerTokenStore,
    private readonly continuityStore: SessionContinuityStore,
    private readonly microsoftTokenCache: MicrosoftTokenCache,
    private readonly clientId: string,
  ) {}

  async signOut(): Promise<void> {
    try {
      await this.authClient.signOut();
    } finally {
      this.bearerStore.clear();
      markExplicitSignOut(this.continuityStore);
      await this.microsoftTokenCache.clear(this.clientId).catch(() => {});
    }
  }
}

export function createSignOutStrategy(options: {
  host: MicrosoftSignInHost;
  authClient: AuthClient;
  bearerStore?: BearerTokenStore;
  continuityStore?: SessionContinuityStore;
  microsoftTokenCache?: MicrosoftTokenCache;
  clientId?: string;
}): SignOutStrategy {
  if (options.host === "office") {
    if (
      !options.bearerStore ||
      !options.continuityStore ||
      !options.microsoftTokenCache ||
      !options.clientId
    ) {
      throw new Error(
        "Office sign-out requires bearerStore, continuityStore, microsoftTokenCache, and clientId.",
      );
    }
    return new OfficeBearerSignOutStrategy(
      options.authClient,
      options.bearerStore,
      options.continuityStore,
      options.microsoftTokenCache,
      options.clientId,
    );
  }
  return new WebCookieSignOutStrategy(options.authClient);
}
```

This is exactly the shape generalized in `00-conventions-and-architecture.md` §6.2 (`createErrorReporter`, `createRequestMonitoring` follow this same factory-function-owns-the-decision pattern) and §6.3 (two capabilities that sound similar — sign-in, sign-out — deliberately kept as two separate interfaces rather than merged). `microsoft-sign-in-strategy.ts` follows the identical shape for `MicrosoftSignInStrategy`/`WebMicrosoftSignInStrategy`.

## What's worth changing here (small, non-structural)

| Item                      | Change                                                                                                                                                      | Why                                                                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ops-soft-gate.ts` naming | Verify this follows the domain/capability naming convention (§2.1) — "soft gate" for what, ops-app-specific access control?                                 | If it's genuinely `apps/ops`-specific policy, question whether it belongs in this shared package at all, or should move to `apps/ops/src/auth/` (mirroring `apps/portal/src/auth/require-permission.ts`, which already stays app-local per `apps/portal.md`) |
| No `errors.ts`            | Add one if any of `microsoft-*.ts` currently throw plain `Error` for domain-meaningful failures (e.g. token exchange failure)                               | Consistency with the `AppError` hierarchy convention (§7) — check `microsoft-naa.ts`/`microsoft-id-token.ts` for `throw new Error(...)` sites                                                                                                                |
| Flat file layout          | Optional: group into `strategies/` (sign-in/sign-out files), `microsoft/` (the 5 Microsoft-specific files), `session/` (cookie/continuity files) subfolders | Not required — this package's files are already named clearly enough that flat is arguably fine; only do this if the file count keeps growing                                                                                                                |

## Design patterns implemented here, and what each solves

| Pattern                   | File(s)                                                                    | Problem solved                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategy**              | `sign-out-strategy.ts`, `microsoft-sign-in-strategy.ts`                    | Web and Office add-in sign-in/sign-out need materially different steps (cookie-based vs. bearer-token + NAA cache clear); calling code depends on the interface, never on which host it's running in |
| **Factory function**      | `createSignOutStrategy`, `createMicrosoftSignInStrategy`                   | Owns "which concrete strategy for this host" in one place, validated eagerly (throws immediately if Office-required deps are missing, rather than failing later inside `signOut()`)                  |
| **Interface Segregation** | `SignOutStrategy` vs. `MicrosoftSignInStrategy` as two separate interfaces | Neither strategy is forced to implement methods it doesn't need; mirrored later for `ErrorReporter` vs. `RequestMonitoring` in `packages/observability.md`                                           |

## Migration order

This package needs no structural migration — it's a reference. The only actions are the three small items in the table above, done opportunistically whenever this package is next touched for an unrelated reason.
