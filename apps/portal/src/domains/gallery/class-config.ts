import type { GalleryAssetClass } from "@deck-pack/ui/components/gallery/class-config";

export type { GalleryAssetClass };

export type GalleryClassConfig = {
  assetClass: GalleryAssetClass;
  title: string;
  singular: string;
  description: string;
  listPath: "/org/gallery/flags" | "/org/gallery/shapes" | "/org/gallery/slides";
  newPath: "/org/gallery/flags/new" | "/org/gallery/shapes/new" | "/org/gallery/slides/new";
  detailPath: (
    id: string,
  ) =>
    | { to: "/org/gallery/flags/$itemId"; params: { itemId: string } }
    | { to: "/org/gallery/shapes/$itemId"; params: { itemId: string } }
    | { to: "/org/gallery/slides/$itemId"; params: { itemId: string } };
};

export const GALLERY_CLASS_CONFIG: Record<GalleryAssetClass, GalleryClassConfig> = {
  flag: {
    assetClass: "flag",
    title: "Flags",
    singular: "flag",
    description: "Manage internal flags for your organization.",
    listPath: "/org/gallery/flags",
    newPath: "/org/gallery/flags/new",
    detailPath: (id) => ({ to: "/org/gallery/flags/$itemId", params: { itemId: id } }),
  },
  shape: {
    assetClass: "shape",
    title: "Shapes",
    singular: "shape",
    description: "Manage internal shapes for your organization.",
    listPath: "/org/gallery/shapes",
    newPath: "/org/gallery/shapes/new",
    detailPath: (id) => ({ to: "/org/gallery/shapes/$itemId", params: { itemId: id } }),
  },
  slide: {
    assetClass: "slide",
    title: "Slides",
    singular: "slide",
    description: "Manage internal slide templates for your organization.",
    listPath: "/org/gallery/slides",
    newPath: "/org/gallery/slides/new",
    detailPath: (id) => ({ to: "/org/gallery/slides/$itemId", params: { itemId: id } }),
  },
};
