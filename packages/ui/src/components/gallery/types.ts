import type { GalleryAssetClass, GalleryItemStatus } from "@deck-pack/db/gallery-catalog";

export type GalleryUploadRole =
  | "svg"
  | "presentation"
  | "thumbnail"
  | "rectangle"
  | "square"
  | "circle";

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
