/** Stable object key — same value as `files.blob_path` in the DB. */
export type ObjectKey = string;

export type CreateUploadTargetInput = {
  key: ObjectKey;
  contentType: string;
  /** Optional size hint; providers may ignore or enforce when supported. */
  byteSize?: number;
  expiresInSeconds: number;
};

export type UploadTarget = {
  key: ObjectKey;
  uploadUrl: string;
  method: "PUT" | "POST";
  /** Headers the client must send with the upload request. */
  headers: Record<string, string>;
  expiresAt: Date;
};

export type CreateDownloadUrlInput = {
  key: ObjectKey;
  expiresInSeconds: number;
};

export type DownloadUrl = {
  key: ObjectKey;
  url: string;
  expiresAt: Date;
};

export type ObjectInfo = {
  key: ObjectKey;
  contentType?: string;
  byteSize?: number;
  etag?: string;
};

/**
 * Provider-agnostic object storage port.
 * App code depends on this type; Azure (today) / Supabase (later) adapt to it.
 */
export type PutObjectInput = {
  key: ObjectKey;
  contentType: string;
  body: Uint8Array;
};

export type ObjectStorage = {
  createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget>;
  createDownloadUrl(input: CreateDownloadUrlInput): Promise<DownloadUrl>;
  head(key: ObjectKey): Promise<ObjectInfo | null>;
  delete(key: ObjectKey): Promise<void>;
  /** Server-side write (local/memory adapters, or Azure SDK fallback). */
  put(input: PutObjectInput): Promise<ObjectInfo>;
};
