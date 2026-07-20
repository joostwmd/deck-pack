import { z } from "zod";

/** Raw search hit from GET /v2/search/{name} */
export const BrandfetchSearchHitSchema = z.object({
  icon: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  domain: z.string().min(1),
  claimed: z.boolean().optional(),
  brandId: z.string().min(1),
});

export const BrandfetchSearchResponseSchema = z.object({
  results: z.array(BrandfetchSearchHitSchema),
});

export const BrandfetchLogoFormatSchema = z.object({
  src: z.string().url(),
  format: z.enum(["svg", "webp", "png", "jpeg"]).or(z.string()),
  height: z.number().int().nullable().optional(),
  width: z.number().int().nullable().optional(),
  /** File size in bytes (not pixel dimensions). */
  size: z.number().int().optional(),
  background: z.enum(["transparent"]).nullable().optional(),
});

export const BrandfetchLogoSchema = z.object({
  type: z.enum(["icon", "logo", "symbol", "other"]).or(z.string()),
  theme: z.enum(["dark", "light"]).nullable().optional(),
  formats: z.array(BrandfetchLogoFormatSchema),
  tags: z.array(z.unknown()).optional(),
});

/** Normalized brand details used by the logos domain. */
export const BrandfetchDetailsResponseSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().nullable(),
  domain: z.string().min(1),
  logos: z.array(BrandfetchLogoSchema),
});

/** Raw Brand API response (subset we care about). */
export const BrandfetchBrandApiResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable().optional(),
  domain: z.string().min(1),
  logos: z.array(BrandfetchLogoSchema).default([]),
});

export type BrandfetchSearchHit = z.infer<typeof BrandfetchSearchHitSchema>;
export type BrandfetchSearchResponse = z.infer<typeof BrandfetchSearchResponseSchema>;
export type BrandfetchLogoFormat = z.infer<typeof BrandfetchLogoFormatSchema>;
export type BrandfetchLogo = z.infer<typeof BrandfetchLogoSchema>;
export type BrandfetchDetailsResponse = z.infer<typeof BrandfetchDetailsResponseSchema>;
export type BrandfetchBrandApiResponse = z.infer<typeof BrandfetchBrandApiResponseSchema>;

/** @deprecated Use BrandfetchSearchHit — kept for export compatibility. */
export type BrandfetchBrand = BrandfetchSearchHit;
/** @deprecated Use BrandfetchSearchHitSchema */
export const BrandfetchBrandSchema = BrandfetchSearchHitSchema;

export interface SearchBrandsInput {
  query: string;
  limit?: number;
}

export interface GetBrandDetailsInput {
  /** Domain, brandId, ticker, ISIN, or crypto symbol accepted by Brand API. */
  identifier: string;
}
