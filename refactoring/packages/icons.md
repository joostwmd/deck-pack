# `packages/icons` (NEW) — domain package with an integration port, plus a dead-code cleanup

Identical shape to `packages/logos.md`/`packages/photos.md`. This domain currently uses `NounProjectClient`, not `Icons8Client` — worth being explicit about, because `Icons8Client` exists in the codebase and could be mistaken for the current provider.

## Current state (`apps/api/src/domains/icons/`)

```
apps/api/src/domains/icons/
  mappers.ts
  routes.ts
  service.ts        — createIconService(deps) — function factory
```

Real current code:

```typescript
export type IconServiceDeps = {
  nounProject: NounProjectClient;
};

export function createIconService(deps: IconServiceDeps) {
  const { nounProject } = deps;
  return {
    search: async (query: string) => {
      const response = await nounProject.searchIcons({ query });
      return mapIconSearchResponse(response);
    },
    getDetails: async (externalId: string) => {
      const response = await nounProject.getIconDetails({ id: externalId });
      return mapIconDetailsResponse(response);
    },
  };
}
```

**Important cleanup that belongs to this migration:** `packages/integrations/src/icons8/` (`Icons8Client`) is unused dead code — confirmed via repo-wide search, it's only ever imported by its own `index.ts`, never by this domain or any router. It also returns hardcoded mock data (`MOCK_SVG`, fake icon results) rather than calling a real API, and its constructor uses positional args instead of the options-object shape every other integrations client uses. Delete it as part of this migration unless there's a concrete near-term plan to wire up real Icons8 — if there is, finish it to match `BrandfetchClient`'s shape (options object, typed error hierarchy) _before_ writing an `Icons8IconIntegration` adapter for it.

## Target file tree

```
packages/icons/
  package.json                       — deps: @deck-pack/integrations (for NounProjectClient's type only)
  src/
    integrations/
      icon-integration-port.ts        — IconIntegrationPort interface + IconSearchResult type
      noun-project-icon-integration.ts  — NounProjectIconIntegration implements IconIntegrationPort
      in-memory-icon-integration.ts      — InMemoryIconIntegration, for tests
    use-cases/
      search-icons.ts
      get-icon-details.ts
    index.ts
```

## Target code

```typescript
// integrations/icon-integration-port.ts
export type IconSearchResult = {
  externalId: string;
  name: string;
  previewUrl: string;
};

export interface IconIntegrationPort {
  search(query: string): Promise<IconSearchResult[]>;
  getDetails(externalId: string): Promise<IconSearchResult>;
}
```

```typescript
// integrations/noun-project-icon-integration.ts
export class NounProjectIconIntegration implements IconIntegrationPort {
  constructor(private readonly client: NounProjectClient) {}

  async search(query: string): Promise<IconSearchResult[]> {
    const response = await this.client.searchIcons({ query });
    return mapIconSearchResponse(response);
  }

  async getDetails(externalId: string): Promise<IconSearchResult> {
    const response = await this.client.getIconDetails({ id: externalId });
    return mapIconDetailsResponse(response);
  }
}
```

If Icons8 is ever finished and wired up, it becomes a second, interchangeable implementation of this _same_ port — `Icons8IconIntegration implements IconIntegrationPort` — at which point (and only at that point) does this domain get the "multiple real providers" justification for the port, on top of the testability justification it already has from day one.

## Design patterns implemented here, and what each solves

Identical to `packages/logos.md`/`packages/photos.md` — Port/Adapter, Use Case, Adapter (translation). The dead-code deletion isn't a pattern, it's housekeeping that naturally falls out of giving this domain a real port: once `IconIntegrationPort` exists and only `NounProjectIconIntegration` implements it, the unused, half-finished `Icons8Client` has no ambiguous relationship to anything real anymore, making it obvious it can go.

## Migration order

1. Delete `packages/integrations/src/icons8/` (confirm with the team it's not planned for near-term use before deleting — see caveat above).
2. Write `IconIntegrationPort` + `NounProjectIconIntegration` (wrapping the existing `NounProjectClient` + existing mappers) + `InMemoryIconIntegration`.
3. Convert `search`/`getDetails` into `SearchIcons`/`GetIconDetails` use-case classes.
4. Add `iconIntegration: IconIntegrationPort` to `AppContainer`.
5. Update `apps/api/src/routers/icons-router.ts` to call the use-cases.
6. Delete `apps/api/src/domains/icons/`.
