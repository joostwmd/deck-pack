import { z } from "zod";

export const assetSearchQuerySchema = z.string().trim().min(1).max(100);

export const assetExternalIdSchema = z.string().trim().min(1);

export const assetTypeSchema = z.enum([
  "logo",
  "flag",
  "icon",
  "harvey_ball",
  "photo",
  "slide",
  "shape",
]);

export const assetClientSchema = z.enum(["office", "web"]);

export const assetListItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  name: z.string(),
  scope: z.enum(["global", "org"]).optional(),
});

export const assetInsertPayloadSchema = z.object({
  type: z.enum(["image", "svg"]),
  imageUrl: z.string().optional(),
  svg: z.string().optional(),
});

export const assetVariantItemSchema = assetListItemSchema.extend({
  insert: assetInsertPayloadSchema,
});

export const assetSearchResponseSchema = z.object({
  results: z.array(assetListItemSchema),
});

export const assetDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  variants: z.array(assetVariantItemSchema),
  metadata: z.record(z.string(), z.string()),
});
