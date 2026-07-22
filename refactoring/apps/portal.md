# `apps/portal` — detailed refactor plan

Reference: `00-conventions-and-architecture.md` §2.2, §3.4, §5.

## Current state (for reference during migration)

```
apps/portal/src/
  auth/ (require-permission.ts, use-can.ts)
  components/
  config/
  features/
    account/
    join/
    library-gallery/  (class-config.ts, gallery-catalog-fields.tsx, gallery-detail-panel.tsx, gallery-detail-view.tsx,
                        gallery-list-panel.tsx, gallery-list-view.tsx, gallery-new-panel.tsx, gallery-new-view.tsx,
                        org-library-store.ts, status-badge.tsx, upload-library-file.ts)
    members/
    org-dashboard/
    seats/
    subscription/
  routes/ (_protected/, auth/)
  services/ (app-services.ts, services-context.tsx, types.ts)
  utils/
```

## Target file tree

```
apps/portal/src/
  main.tsx
  routes/
    _protected/
    auth/
  pages/
    account/                — was features/account — composition of organization + billing domains
    org-dashboard/           — was features/org-dashboard
    join/                    — was features/join — composition of organization + members domains
  domains/
    organization/
      organization-panel.tsx
    gallery/
      gallery-list-panel.tsx      — was features/library-gallery/gallery-list-panel.tsx; view+hook now imported from packages/ui and packages/hooks
      gallery-detail-panel.tsx
      gallery-new-panel.tsx
    members/
      members-panel.tsx
    seats/
      seats-panel.tsx
    billing/
      billing-panel.tsx            — was features/subscription
  services/
    app-services.ts                 — constructs Store implementations from @deck-pack/hooks, injected with this app's trpc client
    services-context.tsx
  local/                             — escape hatch; empty until a genuinely portal-only widget needs it
  components/
  config/
  utils/
  auth/
    require-permission.ts
    use-can.ts
```

## What each file contains

| File                                            | Contents                                                                                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main.tsx`                                      | `initBrowserSentry({ app: "portal", ... })`, builds the TanStack Router, wraps in `ServicesProvider` + `QueryClientProvider`. Unchanged in spirit from today, just importing from the renamed observability subpath.                       |
| `pages/account/*`                               | Route-level screen combining data from `organization` and `billing` domains. Does not own a Store — calls `useOrganization()` and `useBilling()` hooks from `@deck-pack/hooks`.                                                            |
| `domains/gallery/gallery-list-panel.tsx`        | Imports `GalleryListView` from `@deck-pack/ui/components/gallery` and `useGalleryItems` from `@deck-pack/hooks/gallery`; adds portal-specific behavior only (e.g. scoping to the current org, hiding admin-only actions that `ops` shows). |
| `services/app-services.ts`                      | Composition root: builds each domain's Store implementation (from `@deck-pack/hooks`) with this app's concrete `trpc` client, assembles into `OpsAppServices`/`PortalAppServices`.                                                         |
| `auth/require-permission.ts`, `auth/use-can.ts` | Stay app-local for now — portal-specific permission-check helpers; promote to `packages/hooks` only if `ops` ever needs the identical check.                                                                                               |

## Example: before/after for a panel

Before (`features/library-gallery/gallery-list-panel.tsx`, duplicated near-verbatim in `apps/ops/src/features/gallery/`):

```typescript
export function GalleryListPanel() {
  const { library } = useServices();
  const listQuery = useQuery({ queryKey: ["library", "list"], queryFn: () => library.list({ assetClass: "flag" }) });
  return <GalleryListView items={listQuery.data ?? []} loading={listQuery.isLoading} />;
}
```

After:

```typescript
// apps/portal/src/domains/gallery/gallery-list-panel.tsx
import { GalleryListView } from "@deck-pack/ui/components/gallery";
import { useGalleryItems } from "@deck-pack/hooks/gallery";

export function GalleryListPanel() {
  const query = useGalleryItems({ assetClass: "flag" });
  return <GalleryListView items={query.data ?? []} loading={query.isLoading} />;
}
```

The view and the hook are identical between `portal` and `ops` now, imported from the same two packages — there is no more duplicated file pair to keep in sync.

## Design patterns implemented here, and what each solves

| Pattern                                      | File(s)                                     | Problem solved                                                                                                             |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Facade**                                   | `services/app-services.ts`                  | Presents one `PortalAppServices` object to the rest of the app, hiding how each Store is wired to the concrete tRPC client |
| **Dependency Injection (via React Context)** | `services/services-context.tsx` (unchanged) | `useServices()` gives panels their Store dependencies without prop-drilling                                                |
| **Composition over duplication**             | `domains/gallery/*`                         | Panels are the only portal-specific code; everything reusable lives in `packages/ui`/`packages/hooks`                      |

## Migration order for this app

1. Rename `features/` → split into `domains/` and `pages/` per the mapping table in `01-target-structure.md` §7 — pure file moves, no behavior change, do this before anything else so subsequent steps land in the right folders.
2. Extract `library-gallery`'s views into `packages/ui/src/components/gallery/` and its store/hook into `packages/hooks/src/gallery/` (coordinate with `apps/ops` — this is the one extraction that affects two apps at once, see `packages/gallery.md`).
3. Update panels to import from the new packages; delete the now-duplicate local view/hook files.
4. Repeat for `organization`, `members`, `seats`, `billing` domains (lower priority — these aren't currently duplicated with `ops`, so there's no urgency, but do it for consistency once the pattern is proven on `gallery`).
