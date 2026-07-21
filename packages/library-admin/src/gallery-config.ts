import type { LibraryAssetClass } from "@deck-pack/db/library-catalog";

export type GalleryAssetClass = Extract<LibraryAssetClass, "flag" | "shape" | "slide">;

/**
 * Route-agnostic gallery class config. Apps supply concrete TanStack paths.
 * `to` values are typed as string so Ops (`/gallery/...`) and Portal (`/org/library/...`) share views.
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
