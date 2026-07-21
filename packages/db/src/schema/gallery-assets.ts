import { relations, sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export {
  FLAG_VARIANT_ROLES,
  GALLERY_ASSET_CLASSES,
  GALLERY_ITEM_NAME_KINDS,
  GALLERY_ITEM_SCOPES,
  GALLERY_ITEM_STATUSES,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  type FlagVariantRole,
  type GalleryAssetClass,
  type GalleryItemNameKind,
  type GalleryItemScope,
  type GalleryItemStatus,
  type ShapeCategory,
  type SlideAspectRatio,
  type SlideCategory,
} from "../gallery-catalog";

import type {
  FlagVariantRole,
  GalleryAssetClass,
  GalleryItemNameKind,
  GalleryItemScope,
  GalleryItemStatus,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
} from "../gallery-catalog";

/** Pure blob metadata — relative path in the Azure container, type, size. */
export const files = pgTable(
  "files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    blobPath: text("blob_path").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    checksum: text("checksum"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("files_blob_path_uidx").on(table.blobPath)],
);

/**
 * Catalog identity + visibility. Class-specific fields live on *_items tables.
 * Merged feed: scope = global OR (scope = org AND organization_id = :orgId).
 */
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assetClass: text("asset_class").notNull().$type<GalleryAssetClass>(),
    scope: text("scope").notNull().$type<GalleryItemScope>(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull().$type<GalleryItemStatus>().default("pending"),
    displayName: text("display_name").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("gallery_items_feed_idx").on(
      table.assetClass,
      table.status,
      table.scope,
      table.organizationId,
    ),
    index("gallery_items_organizationId_idx").on(table.organizationId),
    index("gallery_items_createdByUserId_idx").on(table.createdByUserId),
    index("gallery_items_ready_feed_idx")
      .on(table.assetClass, table.scope, table.organizationId)
      .where(sql`${table.status} = 'ready'`),
  ],
);

/** Searchable labels (display name, aliases, codes). Not arrays — one row per name. */
export const galleryItemNames = pgTable(
  "gallery_item_names",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    galleryItemId: text("gallery_item_id")
      .notNull()
      .references(() => galleryItems.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    kind: text("kind").notNull().$type<GalleryItemNameKind>().default("alias"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("gallery_item_names_normalized_name_idx").on(table.normalizedName),
    index("gallery_item_names_gallery_item_id_idx").on(table.galleryItemId),
    uniqueIndex("gallery_item_names_item_normalized_uidx").on(
      table.galleryItemId,
      table.normalizedName,
    ),
  ],
);

export const shapeItems = pgTable(
  "shape_items",
  {
    galleryItemId: text("gallery_item_id")
      .primaryKey()
      .references(() => galleryItems.id, { onDelete: "cascade" }),
    category: text("category").notNull().$type<ShapeCategory>(),
    /** Null while draft — required before publish. */
    svgFileId: text("svg_file_id").references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("shape_items_category_idx").on(table.category),
    index("shape_items_svg_file_id_idx").on(table.svgFileId),
  ],
);

export const slideItems = pgTable(
  "slide_items",
  {
    galleryItemId: text("gallery_item_id")
      .primaryKey()
      .references(() => galleryItems.id, { onDelete: "cascade" }),
    category: text("category").notNull().$type<SlideCategory>(),
    aspectRatio: text("aspect_ratio").notNull().$type<SlideAspectRatio>(),
    /** Null while draft — required before publish. */
    presentationFileId: text("presentation_file_id").references(() => files.id, {
      onDelete: "restrict",
    }),
    /** Null while draft — required before publish. */
    thumbnailFileId: text("thumbnail_file_id").references(() => files.id, {
      onDelete: "restrict",
    }),
  },
  (table) => [
    index("slide_items_category_idx").on(table.category),
    index("slide_items_aspect_ratio_idx").on(table.aspectRatio),
    index("slide_items_presentation_file_id_idx").on(table.presentationFileId),
    index("slide_items_thumbnail_file_id_idx").on(table.thumbnailFileId),
  ],
);

/**
 * Flag identity. Merge global + org variants in the API by `code` (e.g. US).
 * Uniqueness (one global / one per org per code) is enforced in application code.
 */
export const flagItems = pgTable(
  "flag_items",
  {
    galleryItemId: text("gallery_item_id")
      .primaryKey()
      .references(() => galleryItems.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
  },
  (table) => [index("flag_items_code_idx").on(table.code)],
);

export const flagVariants = pgTable(
  "flag_variants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    flagItemId: text("flag_item_id")
      .notNull()
      .references(() => flagItems.galleryItemId, { onDelete: "cascade" }),
    role: text("role").notNull().$type<FlagVariantRole>(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [
    uniqueIndex("flag_variants_flag_item_id_role_uidx").on(table.flagItemId, table.role),
    index("flag_variants_file_id_idx").on(table.fileId),
  ],
);

export const filesRelations = relations(files, ({ many }) => ({
  shapeItems: many(shapeItems),
  slidePresentations: many(slideItems, { relationName: "slidePresentationFile" }),
  slideThumbnails: many(slideItems, { relationName: "slideThumbnailFile" }),
  flagVariants: many(flagVariants),
}));

export const galleryItemsRelations = relations(galleryItems, ({ one, many }) => ({
  organization: one(organization, {
    fields: [galleryItems.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [galleryItems.createdByUserId],
    references: [user.id],
  }),
  names: many(galleryItemNames),
  shapeItem: one(shapeItems, {
    fields: [galleryItems.id],
    references: [shapeItems.galleryItemId],
  }),
  slideItem: one(slideItems, {
    fields: [galleryItems.id],
    references: [slideItems.galleryItemId],
  }),
  flagItem: one(flagItems, {
    fields: [galleryItems.id],
    references: [flagItems.galleryItemId],
  }),
}));

export const galleryItemNamesRelations = relations(galleryItemNames, ({ one }) => ({
  galleryItem: one(galleryItems, {
    fields: [galleryItemNames.galleryItemId],
    references: [galleryItems.id],
  }),
}));

export const shapeItemsRelations = relations(shapeItems, ({ one }) => ({
  galleryItem: one(galleryItems, {
    fields: [shapeItems.galleryItemId],
    references: [galleryItems.id],
  }),
  svgFile: one(files, {
    fields: [shapeItems.svgFileId],
    references: [files.id],
  }),
}));

export const slideItemsRelations = relations(slideItems, ({ one }) => ({
  galleryItem: one(galleryItems, {
    fields: [slideItems.galleryItemId],
    references: [galleryItems.id],
  }),
  presentationFile: one(files, {
    fields: [slideItems.presentationFileId],
    references: [files.id],
    relationName: "slidePresentationFile",
  }),
  thumbnailFile: one(files, {
    fields: [slideItems.thumbnailFileId],
    references: [files.id],
    relationName: "slideThumbnailFile",
  }),
}));

export const flagItemsRelations = relations(flagItems, ({ one, many }) => ({
  galleryItem: one(galleryItems, {
    fields: [flagItems.galleryItemId],
    references: [galleryItems.id],
  }),
  variants: many(flagVariants),
}));

export const flagVariantsRelations = relations(flagVariants, ({ one }) => ({
  flagItem: one(flagItems, {
    fields: [flagVariants.flagItemId],
    references: [flagItems.galleryItemId],
  }),
  file: one(files, {
    fields: [flagVariants.fileId],
    references: [files.id],
  }),
}));
