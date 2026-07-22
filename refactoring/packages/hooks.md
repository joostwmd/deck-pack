# `packages/hooks` (NEW) — centralized business/data hooks + their Store implementations

Kind: **ui-shared** (per `00-conventions-and-architecture.md` §5, §5.1). This package doesn't exist yet — it's the destination for every React hook that fetches or mutates backend data, one subfolder per domain, replacing the current pattern of each app inlining `useQuery`/`useMutation` calls directly inside its panels.

## Current state (confirmed) — inline data-fetching inside panels, duplicated per app

`apps/ops/src/features/organizations/organizations-list-panel.tsx` (confirmed):

```typescript
export function OrganizationsListPanel() {
  const { organization } = useServices();
  const listQuery = useQuery({ queryKey: ["organization", "list"], queryFn: () => organization.listOrganizations() });
  const teamOrganizations = (listQuery.data ?? []).filter((org) => org.type === "team");
  return (
    <OrganizationsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      organizations={teamOrganizations}
    />
  );
}
```

Every panel across `apps/portal`/`apps/ops` currently hand-writes its own `queryKey` array, its own `queryFn`, and its own loading/error prop-mapping — this is the pattern being centralized. Two concrete costs of the current approach: (1) the `["organization", "list"]` query key is a string literal repeated at every call site, easy to typo or drift; (2) `apps/portal`'s equivalent organization panel (if it exists) would silently duplicate this exact query, unable to share a cache key with `ops`'s version even though they're the same query.

## Target file tree

```
packages/hooks/
  package.json                — deps: @deck-pack/trpc-client (for the TrpcBundle type used by Store factories)
  src/
    organization/
      organization-store.ts      — OrganizationStore interface + createTrpcOrganizationStore(trpc)
      use-organizations.ts
      use-organization.ts
      use-create-organization.ts
      query-keys.ts
    gallery/
      gallery-store.ts             — see packages/gallery.md §4 for the full example
      use-gallery-items.ts
      use-gallery-item.ts
      use-create-gallery-item.ts
      use-publish-gallery-item.ts
      use-archive-gallery-item.ts
      upload-gallery-file.ts
      query-keys.ts
    members/
    billing/
    ... one subfolder per domain actually consumed by a frontend app
    index.ts
```

## Target code

```typescript
// organization/query-keys.ts
export const organizationKeys = {
  list: () => ["organization", "list"] as const,
  detail: (id: string) => ["organization", "detail", id] as const,
};
```

```typescript
// organization/organization-store.ts
export interface OrganizationStore {
  list(): Promise<OrganizationSummary[]>;
  get(id: string): Promise<OrganizationDetail>;
  create(input: CreateOrganizationInput): Promise<{ organizationId: string }>;
}

export function createTrpcOrganizationStore(trpc: TrpcBundle): OrganizationStore {
  return {
    list: () => trpc.organization.list.query(),
    get: (id) => trpc.organization.get.query({ organizationId: id }),
    create: (input) => trpc.organization.create.mutate(input),
  };
}
```

```typescript
// organization/use-organizations.ts
export function useOrganizations() {
  const { organization } = useServices();
  return useQuery({ queryKey: organizationKeys.list(), queryFn: () => organization.list() });
}
```

`apps/ops/src/domains/organization/organization-panel.tsx`, after migration:

```typescript
export function OrganizationsListPanel() {
  const query = useOrganizations();
  const teamOrganizations = (query.data ?? []).filter((org) => org.type === "team");
  return <OrganizationsListView loading={query.isLoading} errorMessage={query.isError ? query.error.message : undefined} organizations={teamOrganizations} />;
}
```

The panel loses its `useServices()` call and its inline `queryFn` entirely — it's now just "call the hook, pass the result to the view," which is the whole point: any app-specific behavior that remains (the `teamOrganizations` filter, in this example) is now visibly the _only_ thing left in the panel, instead of being buried among cache-key and fetch-plumbing code.

## `services/app-services.ts` becomes the composition point

```typescript
// apps/ops/src/services/app-services.ts
export function createAppServices(trpc: TrpcBundle): OpsAppServices {
  return {
    organization: createTrpcOrganizationStore(trpc),
    gallery: createTrpcGalleryStore(trpc),
    billing: createTrpcBillingStore(trpc),
    // ...
  };
}
```

`apps/portal/src/services/app-services.ts` calls the exact same `createTrpc*Store` factories, just with `portal`'s own `trpc` client instance — the Store _implementations_ are shared; only the client instance and which Stores get assembled into each app's services object differ.

## Design patterns implemented here, and what each solves

| Pattern                                   | File(s)                         | Problem solved                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Facade**                                | `<domain>-store.ts`             | Hooks depend on a small, domain-shaped interface (`OrganizationStore`) instead of directly on tRPC's `trpc.organization.list.query()` call shape — if the transport ever changes, only the `createTrpc*Store` factory changes                                                 |
| **Factory function**                      | `createTrpc<Domain>Store(trpc)` | Same "factory owns the construction decision" convention as `createErrorReporter`/`createSignOutStrategy` — here the "decision" is really just "bind this interface to this trpc client instance," but it's still one function, not inlined object literals scattered per app |
| **Single source of truth for cache keys** | `<domain>/query-keys.ts`        | Every hook for a domain imports the same key-builder functions, so `organizationKeys.list()` can never drift between what a `useQuery` reads and what a mutation's `invalidateQueries` call targets                                                                           |
| **Custom Hook (data layer)**              | `use-<domain>*.ts`              | Encapsulates the `useQuery`/`useMutation` + query-key + Store-call boilerplate once per operation, reused identically by every consuming panel across apps                                                                                                                    |

## Migration order

1. Create the package skeleton with just `organization/` (mirrors the `packages/organization.md` backend migration — do frontend and backend for the same domain in the same work session, since the hook's `OrganizationStore` interface shape should mirror the backend's use-cases' input/output shapes).
2. Port `apps/ops`'s inline `useQuery` calls for organizations into `use-organizations.ts` etc.; update the panel.
3. Check whether `apps/portal` has an equivalent organization data-fetch already — if so, delete portal's copy and point it at the same hook.
4. Repeat per domain, prioritizing `gallery` next since it's the most duplicated (see `packages/gallery.md` §3-4 for that specific migration, which happens in lockstep with `packages/ui.md`'s view extraction).
