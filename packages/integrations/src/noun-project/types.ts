import { z } from "zod";

const nounStyleSchema = z.object({
  style: z.string().optional(),
  line_weight: z.number().optional(),
});

export const NounProjectIconSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  term: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
  icon_url: z.string().optional().nullable(),
  attribution: z.string().optional().nullable(),
  license_description: z.string().optional().nullable(),
  styles: z.array(nounStyleSchema).optional(),
  tags: z.array(z.union([z.string(), z.object({ slug: z.string().optional() }).passthrough()])).optional(),
});

export const NounProjectSearchResponseSchema = z.object({
  icons: z.array(NounProjectIconSchema).default([]),
  total: z.number().optional(),
  next_page: z.string().optional().nullable(),
  prev_page: z.string().optional().nullable(),
});

export const NounProjectGetIconResponseSchema = z.object({
  icon: NounProjectIconSchema,
});

export const NounProjectDownloadResponseSchema = z.object({
  base64_encoded_file: z.string().min(1),
  content_type: z.string().optional(),
});

export const NounProjectMoreLikeThisResponseSchema = z.object({
  icons: z.array(NounProjectIconSchema).default([]),
  total: z.number().optional(),
});

export type NounProjectIcon = z.infer<typeof NounProjectIconSchema>;
export type NounProjectSearchResponse = z.infer<typeof NounProjectSearchResponseSchema>;
export type NounProjectGetIconResponse = z.infer<typeof NounProjectGetIconResponseSchema>;
export type NounProjectDownloadResponse = z.infer<typeof NounProjectDownloadResponseSchema>;
export type NounProjectMoreLikeThisResponse = z.infer<
  typeof NounProjectMoreLikeThisResponseSchema
>;

/** Normalized details shape consumed by the icons domain. */
export type NounProjectIconDetails = {
  id: string;
  name: string;
  attribution: string | null;
  thumbnailUrl: string;
  variants: Array<{
    id: string;
    name: string;
    previewUrl: string;
    /** Present when the plan/license allows SVG access. */
    svg: string | null;
  }>;
};

export type SearchNounIconsInput = {
  query: string;
  limit?: number;
  styles?: "solid" | "line";
  thumbnailSize?: 42 | 84 | 200;
  /**
   * Free-tier SVG download only works for public-domain icons.
   * Defaults to true so Office insert can use SVG instead of CDN PNGs.
   */
  publicDomainOnly?: boolean;
};

export type GetNounIconDetailsInput = {
  id: string;
  /** How many style-similar icons to include as extra variants (default 4). */
  similarLimit?: number;
};
