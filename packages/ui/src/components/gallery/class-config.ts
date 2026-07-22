import type { GalleryAssetClass } from "@deck-pack/db/gallery-catalog";

export type { GalleryAssetClass };

/**
 * Route-agnostic gallery class config. Apps supply concrete TanStack paths.
 * `to` values are typed as string so Ops (`/gallery/...`) and Portal (`/org/gallery/...`) share views.
 */
export type GalleryClassConfig = {
  assetClass: GalleryAssetClass;
  title: string;
  singular: string;
  description: string;
  listPath: string;
  newPath: string;
  detailPath: (id: string) => { to: string; params: { itemId: string } };
};
