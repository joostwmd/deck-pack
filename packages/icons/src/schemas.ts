import { z } from "zod";

export const iconSearchQuerySchema = z.string().trim().min(1).max(100);

export const iconExternalIdSchema = z.string().trim().min(1);

export const iconListItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  name: z.string(),
  scope: z.enum(["global", "org"]).optional(),
});

export const iconInsertPayloadSchema = z.object({
  type: z.enum(["image", "svg"]),
  imageUrl: z.string().optional(),
  svg: z.string().optional(),
});

export const iconVariantItemSchema = iconListItemSchema.extend({
  insert: iconInsertPayloadSchema,
});

export const iconSearchResponseSchema = z.object({
  results: z.array(iconListItemSchema),
});

export const iconDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  variants: z.array(iconVariantItemSchema),
  metadata: z.record(z.string(), z.string()),
});
