import { z } from "zod";

export const slideAspectRatioSchema = z.enum(["16:9", "4:3"]);

export const slideSortSchema = z.enum(["relevance", "newest", "name"]);

export const slideSearchInputSchema = z.object({
  query: z.string().trim().max(100).optional(),
  category: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  aspectRatio: slideAspectRatioSchema.optional(),
  sort: slideSortSchema.default("relevance"),
});

export const slideSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  presentationUrl: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  aspectRatio: slideAspectRatioSchema,
  createdAt: z.string(),
});

export const slideSearchFacetsSchema = z.object({
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  aspectRatios: z.array(slideAspectRatioSchema),
});

export const slideSearchResponseSchema = z.object({
  results: z.array(slideSearchResultSchema),
  total: z.number().int(),
  facets: slideSearchFacetsSchema,
});
