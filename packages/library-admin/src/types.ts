import type { LibraryAssetClass, LibraryItemStatus } from "@deck-pack/db/library-catalog";

export type LibraryUploadRole =
  | "svg"
  | "presentation"
  | "thumbnail"
  | "rectangle"
  | "square"
  | "circle";

export type LibraryListItem = {
  id: string;
  assetClass: LibraryAssetClass;
  status: LibraryItemStatus;
  displayName: string;
  updatedAt: Date;
  createdAt: Date;
  category: string | null;
  code: string | null;
  aspectRatio: string | null;
  previewUrl: string | null;
  previewContentType: string | null;
};

export type LibraryItemDetail = {
  id: string;
  assetClass: LibraryAssetClass;
  scope: "global" | "org";
  status: LibraryItemStatus;
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
    assetClass: LibraryAssetClass;
    includeArchived?: boolean;
  }) => Promise<LibraryListItem[]>;
  get: (input: { id: string }) => Promise<LibraryItemDetail>;
  create: (input: {
    assetClass: LibraryAssetClass;
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
  }) => Promise<LibraryItemDetail>;
  publish: (input: { id: string }) => Promise<LibraryItemDetail>;
  unpublish: (input: { id: string }) => Promise<LibraryItemDetail>;
  archive: (input: { id: string }) => Promise<LibraryItemDetail>;
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
  }) => Promise<LibraryItemDetail>;
  putAndFinalize: (input: {
    id: string;
    role: LibraryUploadRole;
    key: string;
    contentType: string;
    dataBase64: string;
  }) => Promise<LibraryItemDetail>;
}
