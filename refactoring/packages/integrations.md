# `packages/integrations` — adapter package (multi-provider, no shared port between providers)

Kind: **adapter**, multi-provider shape — one subfolder per external system, each independently a well-formed OOP client. Per `00-conventions-and-architecture.md` §8.2, there's deliberately **no shared interface across `brandfetch`/`pexels`/`noun-project`** (a logo search and an icon search aren't interchangeable) — the domain-owned ports (`packages/logos.md`, `photos.md`, `icons.md`) sit on _top_ of this package, one per domain, each wrapping exactly one of these clients.

## Current state (confirmed)

```
packages/integrations/src/
  brandfetch/    (errors.ts, types.ts, client.ts, index.ts)   — GOOD, already the reference shape
  pexels/         (errors.ts, types.ts, client.ts, index.ts)   — GOOD, already the reference shape
  noun-project/    (errors.ts, types.ts, client.ts, index.ts)   — GOOD, already the reference shape
  icons8/           (types.ts, client.ts, index.ts — no errors.ts) — DEAD CODE, mocked, inconsistent shape
```

`brandfetch/client.ts` (confirmed, excerpt) — the reference shape every provider here follows correctly already: options-object constructor, typed error classes thrown by status code, injectable `fetchImpl` for testability:

```typescript
export type BrandfetchClientOptions = {
  apiKey: string;
  clientId: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class BrandfetchClient {
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BrandfetchClientOptions) {
    this.apiKey = options.apiKey;
    this.clientId = options.clientId;
    this.baseUrl = options.baseUrl ?? "https://api.brandfetch.io/v2";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async searchBrands(input: SearchBrandsInput): Promise<BrandfetchSearchResponse> {
    const url = new URL(`${this.baseUrl}/search/${encodeURIComponent(input.query.trim())}`);
    url.searchParams.set("c", this.clientId);
    const response = await this.request(url, { method: "GET" });
    if (response.status === 401) throw new BrandfetchAuthError();
    // ... maps remaining status codes to BrandfetchNotFoundError / BrandfetchRateLimitError / BrandfetchUpstreamError
  }
}
```

`icons8/client.ts` (confirmed, in full) — the outlier that needs deleting, not fixing-in-place:

```typescript
export class Icons8Client {
  constructor(_apiKey: string, _baseUrl = "https://api-icons.icons8.com/publicApi/icons") {
    // Reserved for live Icons8 API integration
  }

  async searchIcons(input: SearchIconsInput): Promise<IconSearchResponse> {
    return {
      success: true,
      icons: [
        /* three hardcoded mock results, string-templated from input.term */
      ],
    };
  }

  async getIconById(input: GetIconByIdInput): Promise<IconDetailsResponse> {
    // returns mock data referencing a hardcoded MOCK_SVG constant
  }
}
```

Three concrete problems, all visible in the snippet above: (1) positional constructor args (`_apiKey`, `_baseUrl`), unlike every other client's options object; (2) both leading underscores signal the args are unused — this client never actually calls an API; (3) it returns hardcoded mock data dressed up as a real response, and — confirmed via repo-wide search — nothing in `apps/api/src/domains/icons/service.ts` ever imports or constructs it (that domain uses `NounProjectClient`). It's fully dead code.

## Target file tree

```
packages/integrations/src/
  brandfetch/    — unchanged
  pexels/         — unchanged
  noun-project/    — unchanged
  shared/                       — NEW, private to this package (00-conventions §8.3 — internal folder, not a new top-level package)
    fetch-json.ts                 — fetch → check status → parse JSON → throw typed error helper, if the three clients' request() methods turn out to duplicate this logic (verify before extracting — don't force a helper into existence)
  icons8/                        — DELETED
```

## Design patterns implemented here, and what each solves

| Pattern                                    | File(s)                                                              | Problem solved                                                                                                                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adapter (raw SDK wrapper)**              | `brandfetch/client.ts`, `pexels/client.ts`, `noun-project/client.ts` | Each client owns exactly one external HTTP API's request/response shape; has zero knowledge of deck-pack's domain concepts (that translation happens one layer up, in `packages/logos`/`photos`/`icons`)                                                          |
| **Typed exception hierarchy per provider** | `brandfetch/errors.ts` etc.                                          | Each provider's failure modes (auth, rate limit, not found, upstream 5xx) are distinct classes, letting the domain-level integration adapter (`BrandfetchLogoIntegration`) decide per-error-type how to react, instead of string-matching a generic error message |
| **Dependency Injection (constructor)**     | `fetchImpl?: typeof fetch` on every client                           | Tests can inject a fake `fetch` without a network call, without needing an `InMemory*` variant of the raw client itself — the fake happens one layer up as `InMemoryLogoIntegration` instead                                                                      |

## Why this package does _not_ get a shared `IntegrationPort` interface

This is the concrete case that §8.2 draws the line on: a logo search (`BrandfetchClient.searchBrands`) and an icon search (`NounProjectClient.searchIcons`) are never called interchangeably by any code path — nothing in the system says "try Brandfetch, and if that's down, fall back to Noun Project." Forcing them behind one `ExternalSearchPort<T>` would buy nothing and would hide that they're genuinely different capabilities. The _shared_ thing across all three clients, if it exists, is purely internal plumbing (fetch/parse/status-code-to-error mapping) — that's a private helper function in `shared/`, not a port (§8.2's distinction between "port" and "shared helper").

## Migration order

1. Delete `packages/integrations/src/icons8/` — confirm with the team there's no near-term plan to finish real Icons8 integration first (see caveat in `packages/icons.md`).
2. Read `brandfetch/client.ts`, `pexels/client.ts`, `noun-project/client.ts`'s private `request()`-equivalent methods side by side; only if they're genuinely duplicated (not just similarly-shaped), extract `shared/fetch-json.ts` and have each client's request method call it.
3. No other changes needed — this package is otherwise already at the target standard for the three real providers.
