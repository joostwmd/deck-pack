/**
 * Shared library catalog vocabulary for Ops, API, and the add-in.
 * Kept free of Drizzle so browser apps can import it safely.
 */

/** Uploadable library classes (owned blobs). External types stay out of this catalog. */
export const LIBRARY_ASSET_CLASSES = ["flag", "shape", "slide"] as const;
export type LibraryAssetClass = (typeof LIBRARY_ASSET_CLASSES)[number];

export const LIBRARY_ITEM_SCOPES = ["global", "org"] as const;
export type LibraryItemScope = (typeof LIBRARY_ITEM_SCOPES)[number];

export const LIBRARY_ITEM_STATUSES = ["pending", "ready", "archived"] as const;
export type LibraryItemStatus = (typeof LIBRARY_ITEM_STATUSES)[number];

export const LIBRARY_ITEM_NAME_KINDS = ["display", "alias", "code"] as const;
export type LibraryItemNameKind = (typeof LIBRARY_ITEM_NAME_KINDS)[number];

export const FLAG_VARIANT_ROLES = ["rectangle", "square", "circle"] as const;
export type FlagVariantRole = (typeof FLAG_VARIANT_ROLES)[number];

/** Fixed shape taxonomy — shared by Ops dropdowns and add-in filters. */
export const SHAPE_CATEGORIES = [
  "Arrows",
  "Banners & Ribbons",
  "Callouts",
  "Brackets & Dividers",
  "Frames & Badges",
  "Lines & Connectors",
] as const;
export type ShapeCategory = (typeof SHAPE_CATEGORIES)[number];

/** Fixed slide taxonomy — shared by Ops dropdowns and add-in filters. */
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
