import type { GalleryAssetClass, GalleryItemStatus } from "@deck-pack/db/gallery-catalog";

export type LibraryUploadRole =
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
      role: LibraryUploadRole;
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

export interface LibraryStore {
  list: (input: {
    assetClass: GalleryAssetClass;
    includeArchived?: boolean;
  }) => Promise<GalleryListItem[]>;
  get: (input: { id: string }) => Promise<GalleryItemDetail>;
  create: (input: {
    assetClass: GalleryAssetClass;
    displayName: string;
    aliases?: string[];
    flagCode?: string;
    category?: string;
    aspectRatio?: string;
  }) => Promise<{ id: string }>;
  update: (input: {
    id: string;
    displayName: string;
    aliases: string[];
    flagCode?: string;
    category?: string;
    aspectRatio?: string;
  }) => Promise<GalleryItemDetail>;
  publish: (input: { id: string }) => Promise<GalleryItemDetail>;
  unpublish: (input: { id: string }) => Promise<GalleryItemDetail>;
  archive: (input: { id: string }) => Promise<GalleryItemDetail>;
  createUploadTarget: (input: {
    id: string;
    role: LibraryUploadRole;
    contentType: string;
    byteSize: number;
  }) => Promise<UploadTarget>;
  finalizeUpload: (input: {
    id: string;
    role: LibraryUploadRole;
    key: string;
    contentType: string;
  }) => Promise<GalleryItemDetail>;
  putAndFinalize: (input: {
    id: string;
    role: LibraryUploadRole;
    key: string;
    contentType: string;
    dataBase64: string;
  }) => Promise<GalleryItemDetail>;
}
