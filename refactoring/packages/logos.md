# `packages/logos` (NEW) — domain package with an integration port

Same shape as `packages/organization.md`, with one addition: this domain's "repository" isn't a database, it's a third-party HTTP API (Brandfetch) — the port is an **integration port**, not a repository, but plays the identical DI role.

## Current state (`apps/api/src/domains/logos/`)

```
apps/api/src/domains/logos/
  mappers.ts
  routes.ts
  service.ts        — createLogoService(deps) — function factory
```

Real current code:

```typescript
export type LogoServiceDeps = {
  brandfetch: BrandfetchClient;
};

export function createLogoService(deps: LogoServiceDeps) {
  const { brandfetch } = deps;
  return {
    search: async (query: string) => {
      const response = await brandfetch.searchBrands({ query });
      return mapLogoSearchResponse(response);
    },
    getDetails: async (externalId: string) => {
      const response = await brandfetch.getBrandDetails({ identifier: externalId });
      return mapLogoDetailsResponse(response);
    },
  };
}
```

This already injects `BrandfetchClient` by constructor-shaped `deps` — good instinct already present — but couples the service directly to Brandfetch's specific method names (`searchBrands`, `getBrandDetails`). There's no interface between "what the logos domain needs" and "what Brandfetch's SDK happens to expose," so swapping providers or writing a network-free test both require touching this file.

## Target file tree

```
packages/logos/
  package.json                       — deps: @deck-pack/integrations (for BrandfetchClient's raw SDK type only)
  src/
    domain/
      errors.ts                       — LogoNotFoundError
    integrations/
      logo-integration-port.ts         — LogoIntegrationPort interface + LogoSearchResult type
      brandfetch-logo-integration.ts    — BrandfetchLogoIntegration implements LogoIntegrationPort
      in-memory-logo-integration.ts      — InMemoryLogoIntegration, for tests
    use-cases/
      search-logos.ts
      get-logo-details.ts
    index.ts
```

Note the folder is `integrations/`, not `repositories/` — same role (the thing a use-case depends on to reach an external system), different name because it's not backed by `@deck-pack/db`. The ESLint boundary rule from `00-conventions-and-architecture.md` §3.2 extends trivially: add `{ type: "integration", pattern: "src/integrations/**" }` alongside `repository`, with the same `allow` rules.

## Target code

```typescript
// integrations/logo-integration-port.ts
export type LogoSearchResult = {
  brandId: string;
  name: string | null;
  domain: string;
  logoUrls: string[];
};

export interface LogoIntegrationPort {
  search(query: string, options?: { limit?: number }): Promise<LogoSearchResult[]>;
  getDetails(identifier: string): Promise<LogoSearchResult>;
}
```

```typescript
// integrations/brandfetch-logo-integration.ts
import type { BrandfetchClient } from "@deck-pack/integrations/brandfetch";

export class BrandfetchLogoIntegration implements LogoIntegrationPort {
  constructor(private readonly client: BrandfetchClient) {}

  async search(query: string, options?: { limit?: number }): Promise<LogoSearchResult[]> {
    const response = await this.client.searchBrands({ query, limit: options?.limit });
    return mapLogoSearchResponse(response); // existing mapper slots in unchanged
  }

  async getDetails(identifier: string): Promise<LogoSearchResult> {
    const details = await this.client.getBrandDetails({ identifier });
    return mapLogoDetailsResponse(details);
  }
}
```

```typescript
// integrations/in-memory-logo-integration.ts
export class InMemoryLogoIntegration implements LogoIntegrationPort {
  private readonly seeded: LogoSearchResult[] = [];

  seed(results: LogoSearchResult[]): void {
    this.seeded.push(...results);
  }

  async search(query: string): Promise<LogoSearchResult[]> {
    return this.seeded.filter((r) => r.name?.toLowerCase().includes(query.toLowerCase()));
  }

  async getDetails(identifier: string): Promise<LogoSearchResult> {
    const found = this.seeded.find((r) => r.brandId === identifier);
    if (!found) throw new LogoNotFoundError(identifier);
    return found;
  }
}
```

```typescript
// use-cases/search-logos.ts
export class SearchLogos {
  constructor(private readonly logoIntegration: LogoIntegrationPort) {}
  async execute(query: string): Promise<LogoSearchResult[]> {
    return this.logoIntegration.search(query);
  }
}
```

## Why the port lives here, not in `packages/integrations`

`packages/integrations`'s `BrandfetchClient` is a low-level raw-SDK wrapper — it knows Brandfetch's actual HTTP response shape and nothing about deck-pack's domain (`00-conventions-and-architecture.md` §8.2). The **port** and its **domain-aware adapter** belong with the domain that consumes them, the same relationship `packages/organization`'s `DrizzleOrganizationRepository` has to `packages/db`. If `packages/logos` is ever removed, `BrandfetchClient` and `packages/integrations` are completely unaffected — they don't know this package exists.

## Design patterns implemented here, and what each solves

| Pattern                   | File(s)                                                                                                              | Problem solved                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Port / Adapter**        | `integrations/logo-integration-port.ts` + `brandfetch-logo-integration.ts`                                           | Decouples the `logos` domain from Brandfetch specifically — the reason to add this port is testability (an in-memory fake for tests), not swapping real providers, per `00-conventions-and-architecture.md` §8.2 |
| **Use Case**              | `use-cases/*.ts`                                                                                                     | Same as every other domain — one class per operation                                                                                                                                                             |
| **Adapter (translation)** | `mapLogoSearchResponse`/`mapLogoDetailsResponse` (existing mappers, reused as-is inside `BrandfetchLogoIntegration`) | Converts Brandfetch's raw response shape into the domain's `LogoSearchResult` shape                                                                                                                              |

## Migration order

1. Write `LogoIntegrationPort` + `BrandfetchLogoIntegration` (wrapping the existing `BrandfetchClient` + existing mappers verbatim) + `InMemoryLogoIntegration`.
2. Convert `search`/`getDetails` into `SearchLogos`/`GetLogoDetails` use-case classes.
3. Add `logoIntegration: LogoIntegrationPort` to `AppContainer`.
4. Update `apps/api/src/routers/logos-router.ts` (moved from `domains/logos/routes.ts`) to call the use-cases.
5. Delete `apps/api/src/domains/logos/`.
