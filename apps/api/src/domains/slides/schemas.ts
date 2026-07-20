import { z } from "zod";

import {
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
} from "@deck-pack/db/schema/library-assets";

export const slideAspectRatioSchema = z.enum(SLIDE_ASPECT_RATIOS);
export const slideCategorySchema = z.enum(SLIDE_CATEGORIES);

export const slideSortSchema = z.enum(["relevance", "newest", "name"]);

export const slideSearchInputSchema = z.object({
  query: z.string().trim().max(100).optional(),
  category: slideCategorySchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  aspectRatio: slideAspectRatioSchema.optional(),
  sort: slideSortSchema.default("relevance"),
  internalOnly: z.boolean().optional(),
});

export const slideSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  presentationUrl: z.string(),
  category: slideCategorySchema,
  tags: z.array(z.string()),
  aspectRatio: slideAspectRatioSchema,
  scope: z.enum(["global", "org"]),
  createdAt: z.string(),
});

export const slideSearchFacetsSchema = z.object({
  categories: z.array(slideCategorySchema),
  tags: z.array(z.string()),
  aspectRatios: z.array(slideAspectRatioSchema),
});

export const slideSearchResponseSchema = z.object({
  results: z.array(slideSearchResultSchema),
  total: z.number().int(),
  facets: slideSearchFacetsSchema,
});
