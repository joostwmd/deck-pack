import { z } from "zod";

import {
  FLAG_VARIANT_ROLES,
  LIBRARY_ASSET_CLASSES,
  LIBRARY_ITEM_STATUSES,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
} from "@deck-pack/db/schema/library-assets";

export const libraryAssetClassSchema = z.enum(LIBRARY_ASSET_CLASSES);
export const libraryItemStatusSchema = z.enum(LIBRARY_ITEM_STATUSES);
export const flagVariantRoleSchema = z.enum(FLAG_VARIANT_ROLES);
export const shapeCategorySchema = z.enum(SHAPE_CATEGORIES);
export const slideCategorySchema = z.enum(SLIDE_CATEGORIES);
export const slideAspectRatioSchema = z.enum(SLIDE_ASPECT_RATIOS);
export const libraryUploadRoleSchema = z.enum([
  "svg",
  "presentation",
  "thumbnail",
  "rectangle",
  "square",
  "circle",
]);

/** Category accepted on create/update — refined by asset class in the service. */
export const libraryCategorySchema = z.union([shapeCategorySchema, slideCategorySchema]);

export const libraryFileRefSchema = z.object({
  id: z.string(),
  blobPath: z.string(),
  contentType: z.string(),
  byteSize: z.number().int(),
});

export const libraryListItemSchema = z.object({
  id: z.string(),
  assetClass: libraryAssetClassSchema,
  status: libraryItemStatusSchema,
  displayName: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
  category: z.string().nullable(),
  code: z.string().nullable(),
  aspectRatio: z.string().nullable(),
  /** Short-lived URL suitable for <img src> (null when no preview file yet). */
  previewUrl: z.string().nullable(),
  previewContentType: z.string().nullable(),
});

export const libraryItemDetailSchema = z.object({
  id: z.string(),
  assetClass: libraryAssetClassSchema,
  scope: z.enum(["global", "org"]),
  status: libraryItemStatusSchema,
  displayName: z.string(),
  aliases: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  flag: z
    .object({
      code: z.string(),
      variants: z.array(
        z.object({
          role: flagVariantRoleSchema,
          file: libraryFileRefSchema,
        }),
      ),
    })
    .nullable(),
  shape: z
    .object({
      category: shapeCategorySchema,
      svgFile: libraryFileRefSchema.nullable(),
    })
    .nullable(),
  slide: z
    .object({
      category: slideCategorySchema,
      aspectRatio: slideAspectRatioSchema,
      presentationFile: libraryFileRefSchema.nullable(),
      thumbnailFile: libraryFileRefSchema.nullable(),
    })
    .nullable(),
});

export const uploadTargetSchema = z.object({
  key: z.string(),
  uploadUrl: z.string(),
  method: z.enum(["PUT", "POST"]),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.date(),
  mode: z.enum(["direct", "proxy"]),
});
