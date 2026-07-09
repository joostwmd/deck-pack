import { z } from "zod";

// Brandfetch API response schemas (simplified for now)
export const BrandfetchLogoSchema = z.object({
  type: z.string(),
  theme: z.string(),
  formats: z.array(z.object({
    format: z.string(),
    size: z.number(),
    src: z.url(),
  })),
});

export const BrandfetchBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  logo: z.url().optional(),
  brandId: z.string(),
});

export const BrandfetchSearchResponseSchema = z.object({
  results: z.array(BrandfetchBrandSchema),
});

export const BrandfetchDetailsResponseSchema = z.object({
  brandId: z.string(),
  name: z.string(),
  domain: z.string(),
  logos: z.array(BrandfetchLogoSchema),
});

export type BrandfetchLogo = z.infer<typeof BrandfetchLogoSchema>;
export type BrandfetchBrand = z.infer<typeof BrandfetchBrandSchema>;
export type BrandfetchSearchResponse = z.infer<typeof BrandfetchSearchResponseSchema>;
export type BrandfetchDetailsResponse = z.infer<typeof BrandfetchDetailsResponseSchema>;

// Client input types
export interface SearchBrandsInput {
  query: string;
  limit?: number;
}

export interface GetBrandDetailsInput {
  brandId: string;
}
