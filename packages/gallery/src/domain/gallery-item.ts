import { InvalidStateError } from "@deck-pack/errors";

export const GALLERY_ASSET_CLASSES = ["flag", "shape", "slide"] as const;
export type GalleryAssetClass = (typeof GALLERY_ASSET_CLASSES)[number];

export const GALLERY_ITEM_STATUSES = ["pending", "ready", "archived"] as const;
export type GalleryItemStatus = (typeof GALLERY_ITEM_STATUSES)[number];

export const FLAG_VARIANT_ROLES = ["rectangle", "square", "circle"] as const;
export type FlagVariantRole = (typeof FLAG_VARIANT_ROLES)[number];

export const SHAPE_CATEGORIES = [
  "Arrows",
  "Banners & Ribbons",
  "Callouts",
  "Brackets & Dividers",
  "Frames & Badges",
  "Lines & Connectors",
] as const;
export type ShapeCategory = (typeof SHAPE_CATEGORIES)[number];

export const SLIDE_CATEGORIES = [
  "Intro",
  "Agenda",
  "Content",
  "Data",
  "People",
  "Closing",
] as const;
export type SlideCategory = (typeof SLIDE_CATEGORIES)[number];

export const SLIDE_ASPECT_RATIOS = ["16:9", "4:3"] as const;
export type SlideAspectRatio = (typeof SLIDE_ASPECT_RATIOS)[number];

export const GALLERY_UPLOAD_ROLES = [
  "svg",
  "presentation",
  "thumbnail",
  "rectangle",
  "square",
  "circle",
] as const;
export type GalleryUploadRole = (typeof GALLERY_UPLOAD_ROLES)[number];

export type GalleryScope = { kind: "global" } | { kind: "org"; organizationId: string };

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
  previewBlobPath: string | null;
  previewContentType: string | null;
};

export type GalleryListItemWithPreview = Omit<GalleryListItem, "previewBlobPath"> & {
  previewUrl: string | null;
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
  flag: { code: string; variants: Array<{ role: FlagVariantRole; file: GalleryFileRef }> } | null;
  shape: { category: ShapeCategory; svgFile: GalleryFileRef | null } | null;
  slide: {
    category: SlideCategory;
    aspectRatio: SlideAspectRatio;
    presentationFile: GalleryFileRef | null;
    thumbnailFile: GalleryFileRef | null;
  } | null;
};

export type CreateGalleryItemInput = {
  assetClass: GalleryAssetClass;
  displayName: string;
  aliases?: string[];
  createdByUserId: string | null;
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
};

export type UpdateGalleryItemMetadataInput = {
  id: string;
  displayName: string;
  aliases: string[];
  flagCode?: string;
  category?: ShapeCategory | SlideCategory;
  aspectRatio?: SlideAspectRatio;
};

export function assertMutable(status: GalleryItemStatus, message: string): void {
  if (status === "archived") {
    throw new InvalidStateError(message);
  }
}

export function checkPublishable(detail: GalleryItemDetail): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (detail.assetClass === "flag") {
    if (!detail.flag?.code) missing.push("code");
    const roles = new Set(detail.flag?.variants.map((v) => v.role) ?? []);
    for (const role of FLAG_VARIANT_ROLES) {
      if (!roles.has(role)) missing.push(`variant:${role}`);
    }
  }
  if (detail.assetClass === "shape") {
    if (!detail.shape?.svgFile) missing.push("svg");
  }
  if (detail.assetClass === "slide") {
    if (!detail.slide?.presentationFile) missing.push("presentation");
    if (!detail.slide?.thumbnailFile) missing.push("thumbnail");
  }
  return { ok: missing.length === 0, missing };
}
