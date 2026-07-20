import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export {
  FLAG_VARIANT_ROLES,
  LIBRARY_ASSET_CLASSES,
  LIBRARY_ITEM_NAME_KINDS,
  LIBRARY_ITEM_SCOPES,
  LIBRARY_ITEM_STATUSES,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  type FlagVariantRole,
  type LibraryAssetClass,
  type LibraryItemNameKind,
  type LibraryItemScope,
  type LibraryItemStatus,
  type ShapeCategory,
  type SlideAspectRatio,
  type SlideCategory,
} from "../library-catalog";

import type {
  FlagVariantRole,
  LibraryAssetClass,
  LibraryItemNameKind,
  LibraryItemScope,
  LibraryItemStatus,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
} from "../library-catalog";

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
export const libraryItems = pgTable(
  "library_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    assetClass: text("asset_class").notNull().$type<LibraryAssetClass>(),
    scope: text("scope").notNull().$type<LibraryItemScope>(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    status: text("status").notNull().$type<LibraryItemStatus>().default("pending"),
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
    index("library_items_feed_idx").on(
      table.assetClass,
      table.status,
      table.scope,
      table.organizationId,
    ),
    index("library_items_organizationId_idx").on(table.organizationId),
    index("library_items_createdByUserId_idx").on(table.createdByUserId),
    index("library_items_ready_feed_idx")
      .on(table.assetClass, table.scope, table.organizationId)
      .where(sql`${table.status} = 'ready'`),
  ],
);

/** Searchable labels (display name, aliases, codes). Not arrays — one row per name. */
export const libraryItemNames = pgTable(
  "library_item_names",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    libraryItemId: text("library_item_id")
      .notNull()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    kind: text("kind").notNull().$type<LibraryItemNameKind>().default("alias"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("library_item_names_normalized_name_idx").on(table.normalizedName),
    index("library_item_names_library_item_id_idx").on(table.libraryItemId),
    uniqueIndex("library_item_names_item_normalized_uidx").on(
      table.libraryItemId,
      table.normalizedName,
    ),
  ],
);

export const shapeItems = pgTable(
  "shape_items",
  {
    libraryItemId: text("library_item_id")
      .primaryKey()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
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
    libraryItemId: text("library_item_id")
      .primaryKey()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
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
    libraryItemId: text("library_item_id")
      .primaryKey()
      .references(() => libraryItems.id, { onDelete: "cascade" }),
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
      .references(() => flagItems.libraryItemId, { onDelete: "cascade" }),
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

export const libraryItemsRelations = relations(libraryItems, ({ one, many }) => ({
  organization: one(organization, {
    fields: [libraryItems.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [libraryItems.createdByUserId],
    references: [user.id],
  }),
  names: many(libraryItemNames),
  shapeItem: one(shapeItems, {
    fields: [libraryItems.id],
    references: [shapeItems.libraryItemId],
  }),
  slideItem: one(slideItems, {
    fields: [libraryItems.id],
    references: [slideItems.libraryItemId],
  }),
  flagItem: one(flagItems, {
    fields: [libraryItems.id],
    references: [flagItems.libraryItemId],
  }),
}));

export const libraryItemNamesRelations = relations(libraryItemNames, ({ one }) => ({
  libraryItem: one(libraryItems, {
    fields: [libraryItemNames.libraryItemId],
    references: [libraryItems.id],
  }),
}));

export const shapeItemsRelations = relations(shapeItems, ({ one }) => ({
  libraryItem: one(libraryItems, {
    fields: [shapeItems.libraryItemId],
    references: [libraryItems.id],
  }),
  svgFile: one(files, {
    fields: [shapeItems.svgFileId],
    references: [files.id],
  }),
}));

export const slideItemsRelations = relations(slideItems, ({ one }) => ({
  libraryItem: one(libraryItems, {
    fields: [slideItems.libraryItemId],
    references: [libraryItems.id],
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
  libraryItem: one(libraryItems, {
    fields: [flagItems.libraryItemId],
    references: [libraryItems.id],
  }),
  variants: many(flagVariants),
}));

export const flagVariantsRelations = relations(flagVariants, ({ one }) => ({
  flagItem: one(flagItems, {
    fields: [flagVariants.flagItemId],
    references: [flagItems.libraryItemId],
  }),
  file: one(files, {
    fields: [flagVariants.fileId],
    references: [files.id],
  }),
}));
