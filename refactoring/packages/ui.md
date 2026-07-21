# `packages/ui` — design-system + cross-app view components

Kind: **ui-shared / design-system** (per `00-conventions-and-architecture.md` §8.1, §5). Gains one new top-level folder (`components/<domain>/`) to absorb the cross-app view components currently duplicated across `apps/portal`, `apps/ops`, and the in-progress `packages/library-admin`.

## Current state (confirmed)

```
packages/ui/src/
  app/
    dashboard/
  components/
    composite/
    system/
  hooks/
    use-as-ref.ts, use-file-slot-controller.ts, use-file-uploader-controller.ts,
    use-isomorphic-layout-effect.ts, use-lazy-ref.ts, use-mobile.ts,
    use-otp-sign-in.ts, use-tags-input-controller.ts
  lib/
  styles/
```

**Honest flag, not a clean bill of health:** `hooks/use-otp-sign-in.ts` doesn't obviously belong in the "framework-utility hook" bucket this folder is supposed to be — a hook named around OTP sign-in sounds like it wraps an auth _business_ flow, which per `00-conventions-and-architecture.md` §5 should live in `packages/hooks`, not here. `use-file-slot-controller.ts`/`use-file-uploader-controller.ts` are borderline too — depends on whether they call a Store/backend or are purely local widget-state controllers. **Read each of these eight hooks before moving anything** — don't assume the current split is already correct just because the folder exists.

## Target file tree

```
packages/ui/src/
  app/
    dashboard/
  components/
    system/                     — unchanged: app-agnostic design-system primitives (Button, Input, etc.)
    composite/                   — unchanged: generic assembled components, still app-agnostic
    organization/                  — NEW: cross-app organization views (if/when portal+ops need identical ones)
    gallery/                        — NEW: migrated from packages/library-admin/src/components/* + the duplicated
                                       apps/portal/src/features/library-gallery/* + apps/ops/src/features/gallery/* views
      gallery-list-view.tsx
      gallery-detail-view.tsx
      gallery-new-view.tsx
      gallery-catalog-fields.tsx
      status-badge.tsx
      class-config.ts             — was gallery-config.ts in library-admin
  hooks/                            — AUDITED: only genuinely framework-level, business-agnostic hooks remain
    use-as-ref.ts
    use-isomorphic-layout-effect.ts
    use-lazy-ref.ts
    use-mobile.ts
    use-file-slot-controller.ts       — keep here ONLY if confirmed to be local widget-state, no backend/Store call
    use-tags-input-controller.ts        — keep here ONLY if confirmed to be local widget-state, no backend/Store call
    # use-otp-sign-in.ts and use-file-uploader-controller.ts (if it calls a Store) MOVE to packages/hooks
  lib/
  styles/
```

## Example: `components/gallery/gallery-list-view.tsx` — a pure view, no data-fetching

```typescript
export type GalleryListViewProps = {
  items: GalleryListItem[];
  loading: boolean;
  errorMessage?: string;
  onSelect?: (id: string) => void;
};

export function GalleryListView({ items, loading, errorMessage, onSelect }: GalleryListViewProps) {
  if (loading) return <GalleryListSkeleton />;
  if (errorMessage) return <ErrorState message={errorMessage} />;
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} onClick={() => onSelect?.(item.id)} />
      ))}
    </div>
  );
}
```

This view takes plain props only — no `useQuery`, no `useServices()`, no knowledge of tRPC. That's the dividing line between `packages/ui` (views) and `packages/hooks` (data-fetching): a view component here must be renderable in Storybook with hand-written props and zero providers.

## Design patterns implemented here, and what each solves

| Pattern                            | File(s)                                                                                                                                         | Problem solved                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Presentational/Container split** | `components/<domain>/*-view.tsx` (presentational, here) vs. `<domain>-panel.tsx` (container, in each app) vs. hooks (data, in `packages/hooks`) | Views are trivially reusable across `portal`/`ops` and testable/storybook-able without any backend; the split is enforced by which package a file lives in, not just convention |
| **Composition over duplication**   | `components/gallery/*`                                                                                                                          | Removes the `portal`/`ops`/`library-admin` triple-duplication described in `packages/gallery.md`                                                                                |

## Migration order

1. Audit every file in `hooks/` per the table above — classify each as framework-utility (stays) or business/data (moves to `packages/hooks`).
2. Create `components/gallery/` from the union of `packages/library-admin/src/components/*`, `apps/portal/src/features/library-gallery/*-view.tsx`, and `apps/ops/src/features/gallery/*-view.tsx` — these are near-duplicates today, so this is mostly picking the most complete version of each file and reconciling small differences, not writing new code.
3. Update `apps/portal`/`apps/ops` panels to import from `@deck-pack/ui/components/gallery` (coordinated with `packages/gallery.md`'s migration).
4. Repeat for any other domain once its panels are found to be duplicated (`organization`, etc. — lower priority, not currently duplicated).
