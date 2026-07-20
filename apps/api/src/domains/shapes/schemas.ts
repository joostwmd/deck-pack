import { z } from "zod";

import { SHAPE_CATEGORIES } from "@deck-pack/db/schema/library-assets";

export const shapeCategorySchema = z.enum(SHAPE_CATEGORIES);

export const shapeSearchInputSchema = z.object({
  category: shapeCategorySchema.optional(),
});

export const shapeSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: shapeCategorySchema,
  thumbnailUrl: z.string(),
  svgUrl: z.string(),
  createdAt: z.string(),
});

export const shapeSearchFacetsSchema = z.object({
  categories: z.array(shapeCategorySchema),
});

export const shapeSearchResponseSchema = z.object({
  results: z.array(shapeSearchResultSchema),
  total: z.number().int(),
  facets: shapeSearchFacetsSchema,
});
