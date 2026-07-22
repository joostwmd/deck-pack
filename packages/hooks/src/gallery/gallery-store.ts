import type { GalleryAssetClass, GalleryItemStatus } from "@deck-pack/db/gallery-catalog";

export type GalleryUploadRole =
  | "svg"
  | "presentation"
  | "thumbnail"
  | "rectangle"
  | "square"
  | "circle";

export type GalleryFileRef = {
  id: string;
  blobPath: string;
  contentType: string;
  byteSize: number;
};

export type GalleryListItem = {
  id: string;
  assetClass: GalleryAssetClass;
  status: GalleryItemStatus;
  displayName: string;
  updatedAt: Date;
  createdAt: Date;
  category: string | null;
  code: string | null;
  aspectRatio: string | null;
  previewUrl: string | null;
  previewContentType: string | null;
};

export type GalleryItemDetail = {
  id: string;
  assetClass: GalleryAssetClass;
  scope: "global" | "org";
  status: GalleryItemStatus;
  displayName: string;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
  flag: {
    code: string;
    variants: Array<{
      role: GalleryUploadRole;
      file: { id: string; blobPath: string; contentType: string; byteSize: number };
    }>;
  } | null;
  shape: {
    category: string;
    svgFile: { id: string; blobPath: string; contentType: string; byteSize: number } | null;
  } | null;
  slide: {
    category: string;
    aspectRatio: string;
    presentationFile: {
      id: string;
      blobPath: string;
      contentType: string;
      byteSize: number;
    } | null;
    thumbnailFile: { id: string; blobPath: string; contentType: string; byteSize: number } | null;
  } | null;
};

export type UploadMode = "direct" | "proxy";

export type UploadTarget = {
  key: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  expiresAt: Date;
  mode: UploadMode;
};

export type CreateGalleryItemInput = {
  assetClass: GalleryAssetClass;
  displayName: string;
  aliases?: string[];
  flagCode?: string;
  category?: string;
  aspectRatio?: string;
};

export type UpdateGalleryItemInput = {
  id: string;
  displayName: string;
  aliases: string[];
  flagCode?: string;
  category?: string;
  aspectRatio?: string;
};

export interface GalleryStore {
  list: (input: {
    assetClass: GalleryAssetClass;
    includeArchived?: boolean;
  }) => Promise<GalleryListItem[]>;
  get: (input: { id: string }) => Promise<GalleryItemDetail>;
  create: (input: CreateGalleryItemInput) => Promise<{ id: string }>;
  update: (input: UpdateGalleryItemInput) => Promise<GalleryItemDetail>;
  publish: (input: { id: string }) => Promise<GalleryItemDetail>;
  unpublish: (input: { id: string }) => Promise<GalleryItemDetail>;
  archive: (input: { id: string }) => Promise<GalleryItemDetail>;
  createUploadTarget: (input: {
    id: string;
    role: GalleryUploadRole;
    contentType: string;
    byteSize: number;
  }) => Promise<UploadTarget>;
  finalizeUpload: (input: {
    id: string;
    role: GalleryUploadRole;
    key: string;
    contentType: string;
  }) => Promise<GalleryItemDetail>;
  putAndFinalize: (input: {
    id: string;
    role: GalleryUploadRole;
    key: string;
    contentType: string;
    dataBase64: string;
  }) => Promise<GalleryItemDetail>;
}

/**
 * Duck-typed surface shared by `trpc.gallery` and `trpc.gallery.org`.
 * Inputs/outputs are intentionally loose so Zod-inferred tRPC clients assign.
 */
export type GalleryTrpcApi = {
  list: { query: (input: unknown) => Promise<GalleryListItem[]> };
  get: { query: (input: unknown) => Promise<GalleryItemDetail> };
  create: { mutate: (input: unknown) => Promise<{ id: string }> };
  update: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
  publish: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
  unpublish: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
  archive: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
  createUploadTarget: { mutate: (input: unknown) => Promise<UploadTarget> };
  finalizeUpload: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
  putAndFinalize: { mutate: (input: unknown) => Promise<GalleryItemDetail> };
};

/** Accepts the procedure surface from `trpc.gallery` or `trpc.gallery.org`. */
export function createTrpcGalleryStore(api: GalleryTrpcApi): GalleryStore {
  return {
    list: (input) => api.list.query(input),
    get: (input) => api.get.query(input),
    create: (input) => api.create.mutate(input),
    update: (input) => api.update.mutate(input),
    publish: (input) => api.publish.mutate(input),
    unpublish: (input) => api.unpublish.mutate(input),
    archive: (input) => api.archive.mutate(input),
    createUploadTarget: (input) => api.createUploadTarget.mutate(input),
    finalizeUpload: (input) => api.finalizeUpload.mutate(input),
    putAndFinalize: (input) => api.putAndFinalize.mutate(input),
  };
}
