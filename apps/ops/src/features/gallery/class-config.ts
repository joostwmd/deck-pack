import type { GalleryAssetClass } from "@deck-pack/library-admin/gallery-config";

export type { GalleryAssetClass };

export type GalleryClassConfig = {
  assetClass: GalleryAssetClass;
  title: string;
  singular: string;
  description: string;
  listPath: "/gallery/flags" | "/gallery/shapes" | "/gallery/slides";
  newPath: "/gallery/flags/new" | "/gallery/shapes/new" | "/gallery/slides/new";
  detailPath: (
    id: string,
  ) =>
    | { to: "/gallery/flags/$itemId"; params: { itemId: string } }
    | { to: "/gallery/shapes/$itemId"; params: { itemId: string } }
    | { to: "/gallery/slides/$itemId"; params: { itemId: string } };
};

export const GALLERY_CLASS_CONFIG: Record<GalleryAssetClass, GalleryClassConfig> = {
  flag: {
    assetClass: "flag",
    title: "Flags",
    singular: "flag",
    description: "Manage country and region flags available in the add-in gallery.",
    listPath: "/gallery/flags",
    newPath: "/gallery/flags/new",
    detailPath: (id) => ({ to: "/gallery/flags/$itemId", params: { itemId: id } }),
  },
  shape: {
    assetClass: "shape",
    title: "Shapes",
    singular: "shape",
    description: "Manage global shapes available in the add-in gallery.",
    listPath: "/gallery/shapes",
    newPath: "/gallery/shapes/new",
    detailPath: (id) => ({ to: "/gallery/shapes/$itemId", params: { itemId: id } }),
  },
  slide: {
    assetClass: "slide",
    title: "Slides",
    singular: "slide",
    description: "Manage global slide templates available in the add-in gallery.",
    listPath: "/gallery/slides",
    newPath: "/gallery/slides/new",
    detailPath: (id) => ({ to: "/gallery/slides/$itemId", params: { itemId: id } }),
  },
};
