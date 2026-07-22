# `packages/storage` — adapter package

Kind: **adapter**, single-target shape (one port, multiple provider implementations — per `00-conventions-and-architecture.md` §8.1). This package is the canonical Port/Adapter example referenced throughout the other docs; it needs one small rename, nothing structural.

## Current state (confirmed)

```
packages/storage/src/
  index.ts
  port.ts               — ObjectStorage type (the port) + all its I/O types
  keys.ts                — buildLibraryObjectKey (→ buildGalleryObjectKey, see packages/gallery.md), LibraryBlobRole
  errors.ts               — StorageNotFoundError (already a proper AppError-shaped class — this is the model §7 generalizes)
  adapters/
    memory.ts              — createMemoryObjectStorage() factory function returning MemoryObjectStorage
    azure-blob.ts            — createAzureObjectStorage(config) factory function returning ObjectStorage
```

`port.ts` in full (confirmed) — this is the reference "what a port looks like" for every other adapter package in this refactor:

```typescript
export type ObjectKey = string;

export type CreateUploadTargetInput = {
  key: ObjectKey;
  contentType: string;
  byteSize?: number;
  expiresInSeconds: number;
};
export type UploadMode = "direct" | "proxy";
export type UploadTarget = {
  key: ObjectKey;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  expiresAt: Date;
  mode: UploadMode;
};
export type CreateDownloadUrlInput = { key: ObjectKey; expiresInSeconds: number };
export type DownloadUrl = { key: ObjectKey; url: string; expiresAt: Date };
export type ObjectInfo = { key: ObjectKey; contentType?: string; byteSize?: number; etag?: string };
export type PutObjectInput = { key: ObjectKey; contentType: string; body: Uint8Array };

export type ObjectStorage = {
  createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget>;
  createDownloadUrl(input: CreateDownloadUrlInput): Promise<DownloadUrl>;
  head(key: ObjectKey): Promise<ObjectInfo | null>;
  delete(key: ObjectKey): Promise<void>;
  put(input: PutObjectInput): Promise<ObjectInfo>;
};
```

`adapters/memory.ts` in full (confirmed) — already has everything a fake needs (a `.seed()` method, real in-memory `Map` semantics, throws the real `StorageNotFoundError` on a missing key rather than a generic error) — this is the reference "what an `InMemory*` fake looks like" for every other port in this refactor:

```typescript
export type MemoryObjectStorage = ObjectStorage & {
  seed(key: ObjectKey, object: Omit<MemoryObject, "etag"> & { etag?: string }): void;
};

export function createMemoryObjectStorage(): MemoryObjectStorage {
  const objects = new Map<ObjectKey, MemoryObject>();
  return {
    seed(key, object) {
      objects.set(key, { ...object, etag: object.etag ?? `"${crypto.randomUUID()}"` });
    },
    async createUploadTarget(input) {
      /* returns a memory:// fake upload URL */
    },
    async createDownloadUrl(input) {
      const existing = objects.get(input.key);
      if (!existing) throw new StorageNotFoundError(input.key);
      // returns a data: URL if bytes were seeded, else a memory:// placeholder
    },
    async head(key) {
      /* returns ObjectInfo | null */
    },
    async delete(key) {
      objects.delete(key);
    },
    async put(input) {
      /* stores bytes, returns ObjectInfo with a fresh etag */
    },
  };
}
```

## The one change: factory functions → classes, for naming symmetry with Repositories

Everything else about this package is already correct. The single change requested is purely nominal, for 100% naming symmetry with the `Drizzle<Domain>Repository` / `InMemory<Domain>Repository` naming pattern established once domain packages exist:

| Before                                             | After                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `createMemoryObjectStorage(): MemoryObjectStorage` | `class InMemoryObjectStorage implements ObjectStorage { seed(...) {...} ... }`        |
| `createAzureObjectStorage(config): ObjectStorage`  | `class AzureObjectStorage implements ObjectStorage { constructor(config) {...} ... }` |

```typescript
// adapters/in-memory-object-storage.ts (renamed from memory.ts)
export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<ObjectKey, MemoryObject>();

  seed(key: ObjectKey, object: Omit<MemoryObject, "etag"> & { etag?: string }): void {
    this.objects.set(key, { ...object, etag: object.etag ?? `"${crypto.randomUUID()}"` });
  }

  async createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget> {
    /* identical logic, moved into a method */
  }
  async createDownloadUrl(input: CreateDownloadUrlInput): Promise<DownloadUrl> {
    /* identical logic */
  }
  async head(key: ObjectKey): Promise<ObjectInfo | null> {
    /* identical logic */
  }
  async delete(key: ObjectKey): Promise<void> {
    this.objects.delete(key);
  }
  async put(input: PutObjectInput): Promise<ObjectInfo> {
    /* identical logic */
  }
}
```

```typescript
// adapters/azure-object-storage.ts (renamed from azure-blob.ts)
export class AzureObjectStorage implements ObjectStorage {
  private readonly containerClient: ContainerClient;
  constructor(config: AzureObjectStorageConfig) {
    this.containerClient = new BlobServiceClient(config.connectionString).getContainerClient(
      config.container,
    );
  }
  async createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget> {
    /* identical logic, moved into a method */
  }
  // ...
}
```

Call sites change from `createAzureObjectStorage(azureConfig)` to `new AzureObjectStorage(azureConfig)` in `AppContainer.production()`, and `createMemoryObjectStorage()` to `new InMemoryObjectStorage()` in `AppContainer.forIntegrationTest()`/`forUnitTest()` — mechanical, no behavior change.

## `keys.ts` rename accompanying the gallery rename

`buildLibraryObjectKey` and `LibraryBlobRole` rename to `buildGalleryObjectKey`/`GalleryBlobRole` as part of the `library` → `gallery` collapse — see `packages/gallery.md` for the full rename. This file otherwise stays as-is.

## Design patterns implemented here, and what each solves

| Pattern                   | File(s)                                       | Problem solved                                                                                                                             |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Port / Adapter**        | `port.ts` (`ObjectStorage`) + `adapters/*.ts` | Domain code (`packages/gallery`) depends on the small `ObjectStorage` interface, never on the Azure SDK or a specific provider             |
| **In-memory test double** | `InMemoryObjectStorage`                       | Every domain test that touches file storage runs against real, deterministic in-memory behavior instead of a mocked network call           |
| **Typed domain error**    | `errors.ts` (`StorageNotFoundError`)          | Already the model for `AppError` subclassing (§7) — `createDownloadUrl` throws this specific class on a missing key, not a generic `Error` |

## Migration order

1. Rename `adapters/memory.ts` → `adapters/in-memory-object-storage.ts`, convert to `class InMemoryObjectStorage`.
2. Rename `adapters/azure-blob.ts` → `adapters/azure-object-storage.ts`, convert to `class AzureObjectStorage`.
3. Update the two call sites (`AppContainer.production()`, `AppContainer.forIntegrationTest()`/`forUnitTest()`) to `new` the classes instead of calling the factory functions.
4. Coordinate `keys.ts`'s `Library*` → `Gallery*` rename with `packages/gallery.md`'s migration, not before — this package's rename is independent of that one and can land first.
