import type { GalleryAssetClass } from "@deck-pack/db/gallery-catalog";

export const galleryKeys = {
  all: () => ["gallery"] as const,
  list: (assetClass: GalleryAssetClass, includeArchived: boolean) =>
    ["gallery", "list", assetClass, { includeArchived }] as const,
  detail: (id: string) => ["gallery", "detail", id] as const,
};
