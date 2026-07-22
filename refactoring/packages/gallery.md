# `packages/gallery` (NEW, renamed from `library`) — domain package + the frontend consolidation

This is the most invasive single migration in the whole refactor — it touches the DB, the backend domain, the storage integration, and both `portal`/`ops` frontends at once (they currently have three near-duplicate copies of this UI: `apps/portal/src/features/library-gallery/`, `apps/ops/src/features/gallery/`, and a partial in-progress extraction, `packages/library-admin/`). Do this one last, once the `organization` template (see `packages/organization.md`) has proven the pattern.

## The rename (full detail — summary table in `01-target-structure.md` §8)

Since the project isn't live (local Postgres only, per explicit decision), the rename goes all the way to the DB, not just the application layer:

| Old                                                    | New                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| DB table `library_items`                               | `gallery_items`                                                                                              |
| `packages/db/src/library-catalog.ts`                   | `packages/db/src/gallery-catalog.ts`                                                                         |
| `LibraryAssetClass`, `LibraryItemStatus`               | `GalleryAssetClass`, `GalleryItemStatus`                                                                     |
| `apps/api/src/domains/library/*`                       | `packages/gallery/*`                                                                                         |
| `LibraryStore`, `LibraryItemDetail`, `LibraryListItem` | `GalleryStore`, `GalleryItemDetail`, `GalleryListItem`                                                       |
| `trpc.library.*`                                       | `trpc.gallery.*`                                                                                             |
| `apps/portal/src/features/library-gallery/*`           | `apps/portal/src/domains/gallery/*` (panels only — views/hooks move to shared packages, see §3)              |
| `apps/ops/src/features/gallery/*`                      | `apps/ops/src/domains/gallery/*` (panels only)                                                               |
| `packages/library-admin`                               | removed; contents redistributed into `packages/ui/src/components/gallery/` and `packages/hooks/src/gallery/` |

Migration file needed:

```sql
-- packages/db/src/migrations/00XX_rename_library_to_gallery.sql
ALTER TABLE library_items RENAME TO gallery_items;
-- and any other library_* tables (verify current schema/library-assets.ts for the complete table list before writing this)
```

Do this rename as its own isolated commit before any of the structural changes below — a pure rename is easy to review in isolation; don't tangle it with the Repository/Saga extraction.

## 1. Current state (backend)

```
apps/api/src/domains/library/
  routes.ts                    — tRPC procedures
  org-routes.ts                 — org-scoped variant of the routes
  org-service.ts                 — org-scoped variant of the service
  schemas.ts
  service.ts                     — createLibraryService(deps) — function factory, ServiceResult style
  signed-urls.ts
  upload-target-for-client.ts    — dev-mode direct->proxy upload mode rewrite
```

`service.ts` mixes DB queries (`getGlobalLibraryItem`, `createGlobalLibraryItem`, `setGlobalLibraryItemStatus`, ...) and calls into `deps.storage` (an `ObjectStorage` port) in the same functions — e.g. `finalizeUpload` calls `deps.storage.head(input.key)` then writes to the DB. This is exactly the two-system operation that needs a Saga once it's expressed as a use-case (see §2.3).

## 2. Target file tree (backend)

```
packages/gallery/
  package.json                  — deps: @deck-pack/db, @deck-pack/storage
  src/
    domain/
      gallery-item.ts             — GalleryItem entity — RICH, not anemic (see §2.1: publishability is real business logic)
      errors.ts                    — GalleryItemNotFoundError, ArchivedItemImmutableError, MissingRequiredFilesError
    repositories/
      gallery-repository.ts        — GalleryRepository interface + DrizzleGalleryRepository
      in-memory-gallery-repository.ts
    use-cases/
      list-gallery-items.ts
      get-gallery-item.ts
      create-gallery-item.ts
      update-gallery-item.ts
      publish-gallery-item.ts
      unpublish-gallery-item.ts
      archive-gallery-item.ts
      create-gallery-upload-target.ts
      finalize-gallery-upload.ts       — the Saga example, see §2.3
      put-and-finalize-gallery-upload.ts — the other Saga example, see §2.3
    index.ts
```

### 2.1 Why `GalleryItem` is a rich entity, not anemic

Current code has real business logic scattered as free functions/inline checks — `isLibraryItemPublishable(detail)`, the archived-status guard repeated in `update`/`publish`/`unpublish`/`archive`/`createUploadTarget`/`finalizeUpload`. That's the tell for a rich entity: this behavior belongs on the entity itself, not re-checked ad hoc in every use case.

```typescript
export class GalleryItem {
  constructor(
    public readonly id: string,
    public readonly assetClass: GalleryAssetClass,
    public status: GalleryItemStatus,
    private readonly files: Record<GalleryUploadRole, GalleryFile | null>,
  ) {}

  assertMutable(): void {
    if (this.status === "archived") {
      throw new ArchivedItemImmutableError(this.id);
    }
  }

  checkPublishable(): { ok: true } | { ok: false; missing: string[] } {
    const required = REQUIRED_FILES_BY_CLASS[this.assetClass];
    const missing = required.filter((role) => !this.files[role]);
    return missing.length === 0 ? { ok: true } : { ok: false, missing };
  }
}
```

Use cases become thin orchestration on top of this — `PublishGalleryItem.execute()` loads the entity, calls `.checkPublishable()`, throws `MissingRequiredFilesError` if not, else tells the repository to persist the new status. The business rule lives in exactly one place instead of being re-derived per use case.

### 2.2 `GalleryRepository` — one interface, both real query groups folded in

```typescript
export interface GalleryRepository {
  list(assetClass: GalleryAssetClass, includeArchived?: boolean): Promise<GalleryListItem[]>;
  findById(id: string): Promise<GalleryItem | null>;
  create(input: CreateGalleryItemInput): Promise<{ id: string }>;
  updateMetadata(id: string, input: UpdateGalleryItemMetadataInput): Promise<void>;
  setStatus(id: string, status: GalleryItemStatus): Promise<void>;
  attachFile(id: string, file: AttachedFileInput): Promise<void>;
}

export class DrizzleGalleryRepository implements GalleryRepository {
  constructor(private readonly uow: UnitOfWork) {} // same shared instance as every other Repository in the AppContainer — see 00-conventions §10.2

  // one method per current packages/db/src/queries/libraryAdmin.ts export, same SQL, grouped under this class,
  // each calling this.uow.getDb() instead of importing `tx`
}
```

### 2.3 The Saga — `finalizeGalleryUpload`/`putAndFinalizeGalleryUpload`

This is the concrete worked example referenced throughout `00-conventions-and-architecture.md` §10.1 — a use case spanning two systems (blob storage + Postgres) that don't share a transaction:

```typescript
export class PutAndFinalizeGalleryUpload {
  constructor(
    private readonly repo: GalleryRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: PutAndFinalizeInput): Promise<GalleryItemDetail> {
    const item = await this.repo.findById(input.id);
    if (!item) throw new GalleryItemNotFoundError(input.id);
    item.assertMutable();

    const saga = new Saga();

    const objectInfo = await this.storage.put({
      key: input.key,
      contentType: input.contentType,
      body: Buffer.from(input.dataBase64, "base64"),
    });
    saga.onRollback(() => this.storage.delete(input.key)); // blob now exists; roll back if the DB write below fails

    try {
      await this.repo.attachFile(input.id, {
        role: input.role,
        key: input.key,
        contentType: objectInfo.contentType,
        byteSize: objectInfo.byteSize,
        checksum: objectInfo.etag,
      });
    } catch (error) {
      await saga.rollback();
      throw error;
    }

    return this.repo.findById(input.id) as Promise<GalleryItemDetail>;
  }
}
```

Note what does _not_ need a Saga: `finalizeGalleryUpload` (client uploaded directly to blob storage via a signed URL, server just verifies with `storage.head()` then writes one DB row) is a single-write operation on the DB side — no rollback needed because there's only one mutation. Only `putAndFinalize` (server performs the blob write itself, then a DB write) has two mutations in sequence, which is the actual trigger for reaching for a Saga — don't add one just because storage and DB both appear in a use case.

## 3. Current state (frontend) — the duplication being removed

```
apps/portal/src/features/library-gallery/    (11 files)
apps/ops/src/features/gallery/                (10 files, ~9 near-identical to portal's)
packages/library-admin/src/                   (in-progress partial extraction: components/, gallery-config.ts, types.ts, upload-library-file.ts)
```

`class-config.ts`, `gallery-catalog-fields.tsx`, `gallery-detail-view.tsx`, `gallery-list-view.tsx`, `gallery-new-view.tsx`, `status-badge.tsx` are duplicated near-verbatim between `portal` and `ops`; `library-admin` was a first attempt at fixing this but predates the "one central place, no per-file judgment call" rule (`00-conventions-and-architecture.md` §5) — it's superseded, not extended.

## 4. Target file tree (frontend)

```
packages/ui/src/components/gallery/
  gallery-list-view.tsx
  gallery-detail-view.tsx
  gallery-new-view.tsx
  gallery-catalog-fields.tsx
  status-badge.tsx
  class-config.ts

packages/hooks/src/gallery/
  gallery-store.ts             — GalleryStore interface + tRPC-backed implementation (parameterized by the app's trpc client)
  use-gallery-items.ts
  use-gallery-item.ts
  use-create-gallery-item.ts
  use-publish-gallery-item.ts
  use-archive-gallery-item.ts
  query-keys.ts
  upload-gallery-file.ts        — client-side upload orchestration (was upload-library-file.ts)

apps/portal/src/domains/gallery/
  gallery-list-panel.tsx        — imports the view+hook above, adds nothing except portal-specific scoping
  gallery-detail-panel.tsx
  gallery-new-panel.tsx

apps/ops/src/domains/gallery/
  gallery-list-panel.tsx        — imports the SAME view+hook, adds ops-only admin actions (force publish, etc.)
  gallery-detail-panel.tsx
  gallery-new-panel.tsx
```

`GalleryStore` interface (`packages/hooks/src/gallery/gallery-store.ts`):

```typescript
export interface GalleryStore {
  list(input: {
    assetClass: GalleryAssetClass;
    includeArchived?: boolean;
  }): Promise<GalleryListItem[]>;
  get(input: { id: string }): Promise<GalleryItemDetail>;
  create(input: CreateGalleryItemInput): Promise<{ id: string }>;
  publish(input: { id: string }): Promise<GalleryItemDetail>;
  createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget>;
  putAndFinalize(input: PutAndFinalizeInput): Promise<GalleryItemDetail>;
}

export function createTrpcGalleryStore(trpc: TrpcBundle): GalleryStore {
  return {
    list: (input) => trpc.gallery.list.query(input),
    get: (input) => trpc.gallery.get.query(input),
    create: (input) => trpc.gallery.create.mutate(input),
    publish: (input) => trpc.gallery.publish.mutate(input),
    createUploadTarget: (input) => trpc.gallery.createUploadTarget.mutate(input),
    putAndFinalize: (input) => trpc.gallery.putAndFinalize.mutate(input),
  };
}
```

`use-gallery-items.ts`:

```typescript
export function useGalleryItems(input: {
  assetClass: GalleryAssetClass;
  includeArchived?: boolean;
}) {
  const { gallery } = useServices();
  return useQuery({ queryKey: galleryKeys.list(input), queryFn: () => gallery.list(input) });
}
```

## Design patterns implemented here, and what each solves

| Pattern                                         | File(s)                                                                | Problem solved                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Rich Domain Model**                           | `domain/gallery-item.ts`                                               | Publishability and mutability rules live on the entity once, instead of being re-checked ad hoc in six different service methods     |
| **Repository**                                  | `repositories/gallery-repository.ts`                                   | One interface over the DB, one over blob storage per use case, both swappable for in-memory fakes in tests                           |
| **Saga (compensating transaction)**             | `use-cases/put-and-finalize-gallery-upload.ts`                         | Blob write + DB write don't share a transaction; rolls back the orphaned blob if the DB write fails                                  |
| **Facade** (frontend)                           | `packages/hooks/src/gallery/gallery-store.ts`                          | Hooks and panels depend on `GalleryStore`'s small interface, not on tRPC's client shape directly                                     |
| **Template/consistent duplication elimination** | `packages/ui/src/components/gallery/*`, `packages/hooks/src/gallery/*` | Two apps consume identical views/hooks; per-app differences live only in the panel (see `apps/ops.md` for the force-publish example) |

## Migration order for this package

1. Do the DB/naming rename first (§0), as its own commit.
2. Extract `packages/gallery` backend package following the `organization` template, including the entity's business-rule methods and the two Saga use cases — this is higher-risk than `organization` because of the two-system operations, so write integration tests against `AppContainer.forIntegrationTest()` (PGlite + `InMemoryObjectStorage`) covering the rollback path specifically (force the DB write to fail after the blob write succeeds, assert the blob was deleted).
3. Extract the frontend views into `packages/ui/src/components/gallery/` and hooks/store into `packages/hooks/src/gallery/` — do this as one coordinated change touching both `portal` and `ops`, since both apps' panels need to switch imports simultaneously (they can't half-migrate without one app breaking).
4. Delete `apps/portal/src/features/library-gallery/`, `apps/ops/src/features/gallery/`, and `packages/library-admin/` once both apps' panels are confirmed working against the new packages.
