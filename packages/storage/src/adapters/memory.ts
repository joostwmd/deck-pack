import { StorageNotFoundError } from "../errors";
import type {
  CreateDownloadUrlInput,
  CreateUploadTargetInput,
  DownloadUrl,
  ObjectInfo,
  ObjectKey,
  ObjectStorage,
  PutObjectInput,
  UploadTarget,
} from "../port";

type MemoryObject = {
  contentType: string;
  byteSize: number;
  body?: Uint8Array;
  etag: string;
};

function assertPositiveTtl(expiresInSeconds: number): void {
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error("expiresInSeconds must be a positive number");
  }
}

export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<ObjectKey, MemoryObject>();

  /** Simulate a successful client upload for tests. */
  seed(key: ObjectKey, object: Omit<MemoryObject, "etag"> & { etag?: string }): void {
    this.objects.set(key, {
      contentType: object.contentType,
      byteSize: object.byteSize,
      body: object.body,
      etag: object.etag ?? `"${crypto.randomUUID()}"`,
    });
  }

  async createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget> {
    assertPositiveTtl(input.expiresInSeconds);
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);

    return {
      key: input.key,
      uploadUrl: `memory://upload/${encodeURIComponent(input.key)}?exp=${expiresAt.toISOString()}`,
      method: "PUT",
      headers: {
        "Content-Type": input.contentType,
      },
      expiresAt,
      mode: "proxy",
    };
  }

  async createDownloadUrl(input: CreateDownloadUrlInput): Promise<DownloadUrl> {
    assertPositiveTtl(input.expiresInSeconds);
    const existing = this.objects.get(input.key);
    if (!existing) {
      throw new StorageNotFoundError(input.key);
    }

    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);

    // Browser-renderable URL for local/dev (memory:// cannot be used as <img src>).
    if (existing.body) {
      const base64 = Buffer.from(existing.body).toString("base64");
      return {
        key: input.key,
        url: `data:${existing.contentType};base64,${base64}`,
        expiresAt,
      };
    }

    return {
      key: input.key,
      url: `memory://download/${encodeURIComponent(input.key)}?exp=${expiresAt.toISOString()}`,
      expiresAt,
    };
  }

  async head(key: ObjectKey): Promise<ObjectInfo | null> {
    const existing = this.objects.get(key);
    if (!existing) {
      return null;
    }

    return {
      key,
      contentType: existing.contentType,
      byteSize: existing.byteSize,
      etag: existing.etag,
    };
  }

  async delete(key: ObjectKey): Promise<void> {
    this.objects.delete(key);
  }

  async put(input: PutObjectInput): Promise<ObjectInfo> {
    const etag = `"${crypto.randomUUID()}"`;
    this.objects.set(input.key, {
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      body: input.body,
      etag,
    });
    return {
      key: input.key,
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      etag,
    };
  }
}
