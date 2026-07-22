# `apps/ops` — detailed refactor plan

Reference: `00-conventions-and-architecture.md` §2.2, §3.4, §5. `ops` is the internal admin console — same tech stack and shape as `portal`, so this doc only calls out what's different.

## Current state (for reference during migration)

```
apps/ops/src/
  components/
  config/
  features/
    dashboard/
    gallery/  (class-config.ts, gallery-catalog-fields.tsx, gallery-detail-panel.tsx, gallery-detail-view.tsx,
               gallery-list-panel.tsx, gallery-list-view.tsx, gallery-new-panel.tsx, gallery-new-view.tsx,
               status-badge.tsx, upload-library-file.ts)
    organizations/
    plans/
    users/
  routes/ (_protected/)
  services/ (app-services.ts, services-context.tsx, types.ts)
  utils/
```

## Target file tree

```
apps/ops/src/
  main.tsx
  routes/
    _protected/
  pages/
    dashboard/                  — was features/dashboard — composition across organization/billing/users domains
  domains/
    organization/
      organization-panel.tsx    — was features/organizations; admin-only actions (e.g. force delete) live here, not in the shared view
    gallery/
      gallery-list-panel.tsx    — imports the SAME view/hook packages as apps/portal/src/domains/gallery
      gallery-detail-panel.tsx
      gallery-new-panel.tsx
    billing/
      billing-panel.tsx          — was features/plans
    users/
      users-panel.tsx
  services/
    app-services.ts
    services-context.tsx
  local/
  components/
  config/
  utils/
```

## What's different from `portal`

| Concern              | `ops` specifics                                                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Naming rename        | `features/organizations` (plural) → `domains/organization` (singular) — this app currently has the naming drift flagged in `00-conventions-and-architecture.md` §2.2; `portal` doesn't have this particular mismatch                                                                                       |
| `features/plans`     | Renamed to `domains/billing` — same backend domain as portal's `subscription`, previously two different frontend names for one backend concept                                                                                                                                                             |
| Admin-only behavior  | `organization-panel.tsx` and `gallery-detail-panel.tsx` in `ops` inject admin actions (e.g. "force delete", "publish without review") that `portal`'s equivalent panels never show — this is exactly the kind of per-app difference that's supposed to live in the panel, not fork the shared view or hook |
| `features/dashboard` | Becomes `pages/dashboard` — composes `organization`, `billing`, and `users` domain hooks for the admin landing page; owns no Store of its own                                                                                                                                                              |

## Example: same view/hook, different panel behavior

```typescript
// apps/ops/src/domains/gallery/gallery-detail-panel.tsx
import { GalleryDetailView } from "@deck-pack/ui/components/gallery";
import { useGalleryItem, usePublishGalleryItem, useArchiveGalleryItem } from "@deck-pack/hooks/gallery";

export function GalleryDetailPanel({ id }: { id: string }) {
  const item = useGalleryItem(id);
  const publish = usePublishGalleryItem();
  const archive = useArchiveGalleryItem();

  return (
    <GalleryDetailView
      item={item.data}
      loading={item.isLoading}
      // ops-only: admins can force-publish without the review step portal users go through
      onForcePublish={() => publish.mutate({ id, skipReview: true })}
      onArchive={() => archive.mutate({ id })}
    />
  );
}
```

```typescript
// apps/portal/src/domains/gallery/gallery-detail-panel.tsx
import { GalleryDetailView } from "@deck-pack/ui/components/gallery";
import { useGalleryItem } from "@deck-pack/hooks/gallery";

export function GalleryDetailPanel({ id }: { id: string }) {
  const item = useGalleryItem(id);
  return <GalleryDetailView item={item.data} loading={item.isLoading} />; // read-only for portal users
}
```

Same imported view, same imported hook, genuinely different panel — this is the concrete illustration of the rule in `00-conventions-and-architecture.md` §5: per-app differences belong in the panel, never in a forked copy of the view or hook.

## Design patterns implemented here, and what each solves

Identical to `apps/portal` (Facade over `app-services.ts`, DI via `services-context.tsx`) — see `apps/portal.md`. No additional patterns are introduced specifically for `ops`.

## Migration order for this app

1. Rename `features/organizations` → `domains/organization`, `features/plans` → `domains/billing`, `features/dashboard` → `pages/dashboard`, `features/users` → `domains/users` — pure moves.
2. Coordinate the `gallery` extraction with `apps/portal` (same step as `packages/gallery.md` describes) — this is the one migration step that must happen for both apps together, since it deletes files from both.
3. Verify `ops`-specific admin actions (force delete, force publish) are preserved in the panel layer after the shared view/hook move — this is the most likely place to accidentally drop admin-only functionality during the extraction, since it's easy to copy the `portal` version of a component and forget the extra props `ops` was passing in.
