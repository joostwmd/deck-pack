import { z } from "zod";

export const logoSearchQuerySchema = z.string().trim().min(1).max(100);

export const logoExternalIdSchema = z.string().trim().min(1);

export const logoListItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  name: z.string(),
  scope: z.enum(["global", "org"]).optional(),
});

export const logoInsertPayloadSchema = z.object({
  type: z.enum(["image", "svg"]),
  imageUrl: z.string().optional(),
  svg: z.string().optional(),
});

export const logoVariantItemSchema = logoListItemSchema.extend({
  insert: logoInsertPayloadSchema,
});

export const logoSearchResponseSchema = z.object({
  results: z.array(logoListItemSchema),
});

export const logoDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  variants: z.array(logoVariantItemSchema),
  metadata: z.record(z.string(), z.string()),
});
