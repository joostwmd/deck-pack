import { z } from "zod";

export const shapeSearchInputSchema = z.object({
  category: z.string().trim().min(1).optional(),
});

export const shapeSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  thumbnailUrl: z.string(),
  svgUrl: z.string(),
  createdAt: z.string(),
});

export const shapeSearchFacetsSchema = z.object({
  categories: z.array(z.string()),
});

export const shapeSearchResponseSchema = z.object({
  results: z.array(shapeSearchResultSchema),
  total: z.number().int(),
  facets: shapeSearchFacetsSchema,
});
