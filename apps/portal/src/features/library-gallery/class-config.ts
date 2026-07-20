export type GalleryAssetClass = "flag" | "shape" | "slide";

export type GalleryClassConfig = {
  assetClass: GalleryAssetClass;
  title: string;
  singular: string;
  description: string;
  listPath: "/org/library/flags" | "/org/library/shapes" | "/org/library/slides";
  newPath: "/org/library/flags/new" | "/org/library/shapes/new" | "/org/library/slides/new";
  detailPath: (
    id: string,
  ) =>
    | { to: "/org/library/flags/$itemId"; params: { itemId: string } }
    | { to: "/org/library/shapes/$itemId"; params: { itemId: string } }
    | { to: "/org/library/slides/$itemId"; params: { itemId: string } };
};

export const GALLERY_CLASS_CONFIG: Record<GalleryAssetClass, GalleryClassConfig> = {
  flag: {
    assetClass: "flag",
    title: "Flags",
    singular: "flag",
    description: "Manage internal flags for your organization.",
    listPath: "/org/library/flags",
    newPath: "/org/library/flags/new",
    detailPath: (id) => ({ to: "/org/library/flags/$itemId", params: { itemId: id } }),
  },
  shape: {
    assetClass: "shape",
    title: "Shapes",
    singular: "shape",
    description: "Manage internal shapes for your organization.",
    listPath: "/org/library/shapes",
    newPath: "/org/library/shapes/new",
    detailPath: (id) => ({ to: "/org/library/shapes/$itemId", params: { itemId: id } }),
  },
  slide: {
    assetClass: "slide",
    title: "Slides",
    singular: "slide",
    description: "Manage internal slide templates for your organization.",
    listPath: "/org/library/slides",
    newPath: "/org/library/slides/new",
    detailPath: (id) => ({ to: "/org/library/slides/$itemId", params: { itemId: id } }),
  },
};
