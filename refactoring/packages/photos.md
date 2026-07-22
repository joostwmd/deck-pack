# `packages/photos` (NEW) — domain package with an integration port

Identical shape to `packages/logos.md` — read that one first, this doc only covers what's different for photos/Pexels.

## Current state (`apps/api/src/domains/photos/`)

```
apps/api/src/domains/photos/
  mappers.ts
  routes.ts
  schemas.ts
  service.ts        — createPhotoService(deps) — function factory
```

Real current code:

```typescript
export type PhotoServiceDeps = {
  pexels: PexelsClient;
};

export function createPhotoService(deps: PhotoServiceDeps) {
  const { pexels } = deps;
  return {
    search: async (input: z.infer<typeof photoSearchInputSchema>) => {
      const searchInput: SearchPhotosInput = {
        query: input.query,
        orientation: input.orientation,
        size: input.size,
        color: input.color as SearchPhotosInput["color"],
        locale: input.locale,
        page: input.page,
        perPage: input.perPage,
      };
      const response = await pexels.searchPhotos(searchInput);
      return mapPexelsSearchResponse(response);
    },
  };
}
```

## Target file tree

```
packages/photos/
  package.json                        — deps: @deck-pack/integrations (for PexelsClient's type only)
  src/
    integrations/
      image-integration-port.ts        — ImageIntegrationPort interface + ImageSearchResult type
      pexels-image-integration.ts        — PexelsImageIntegration implements ImageIntegrationPort
      in-memory-image-integration.ts      — InMemoryImageIntegration, for tests
    use-cases/
      search-photos.ts
    index.ts
```

## Target code

```typescript
// integrations/image-integration-port.ts
export type ImageSearchInput = {
  query: string;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  color?: string;
  locale?: string;
  page?: number;
  perPage?: number;
};

export type ImageSearchResult = {
  photos: Array<{
    id: number;
    url: string;
    photographer: string;
    alt: string;
    sizes: Record<string, string>;
  }>;
  page: number;
  totalResults: number;
};

export interface ImageIntegrationPort {
  search(input: ImageSearchInput): Promise<ImageSearchResult>;
}
```

```typescript
// integrations/pexels-image-integration.ts
export class PexelsImageIntegration implements ImageIntegrationPort {
  constructor(private readonly client: PexelsClient) {}

  async search(input: ImageSearchInput): Promise<ImageSearchResult> {
    const response = await this.client.searchPhotos({
      query: input.query,
      orientation: input.orientation,
      size: input.size,
      color: input.color as SearchPhotosInput["color"],
      locale: input.locale,
      page: input.page,
      perPage: input.perPage,
    });
    return mapPexelsSearchResponse(response); // existing mapper, unchanged
  }
}
```

```typescript
// use-cases/search-photos.ts
export class SearchPhotos {
  constructor(private readonly imageIntegration: ImageIntegrationPort) {}
  async execute(input: ImageSearchInput): Promise<ImageSearchResult> {
    return this.imageIntegration.search(input);
  }
}
```

The current `z.infer<typeof photoSearchInputSchema>` → `SearchPhotosInput` re-shaping that used to happen inline inside the service function now happens inside `PexelsImageIntegration.search()` — the use-case only ever deals with the domain's own `ImageSearchInput` type, never Pexels' SDK-specific input shape. The zod schema (`photoSearchInputSchema`) stays in the tRPC router layer as the input validator; the domain's `ImageSearchInput` type is the trusted, already-validated shape the use-case actually operates on.

## Design patterns implemented here, and what each solves

Identical to `packages/logos.md` — Port/Adapter for testability, Use Case for the single operation, Adapter (translation) for the existing mapper. No new patterns introduced.

## Migration order

1. Write `ImageIntegrationPort` + `PexelsImageIntegration` (wrapping the existing `PexelsClient` + existing mapper) + `InMemoryImageIntegration`.
2. Convert `search` into the `SearchPhotos` use-case class.
3. Add `imageIntegration: ImageIntegrationPort` to `AppContainer`.
4. Update `apps/api/src/routers/photos-router.ts` to call the use-case; keep `photoSearchInputSchema` at the router layer as the zod validator.
5. Delete `apps/api/src/domains/photos/`.
