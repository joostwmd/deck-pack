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

export const trackAssetInsertionInputSchema = z.object({
  assetType: assetTypeSchema,
  externalId: assetExternalIdSchema,
  client: assetClientSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const trackAssetInsertionOutputSchema = z.object({
  id: z.string(),
});

export const photoOrientationSchema = z.enum(["landscape", "portrait", "square"]);

export const photoSizeSchema = z.enum(["large", "medium", "small"]);

export const photoNamedColorSchema = z.enum([
  "red",
  "orange",
  "yellow",
  "green",
  "turquoise",
  "blue",
  "violet",
  "pink",
  "brown",
  "black",
  "gray",
  "white",
]);

export const photoColorSchema = z.union([
  photoNamedColorSchema,
  z.string().regex(/^#[0-9a-fA-F]{6}$/),
]);

export const photoLocaleSchema = z.enum([
  "en-US",
  "pt-BR",
  "es-ES",
  "ca-ES",
  "de-DE",
  "it-IT",
  "fr-FR",
  "sv-SE",
  "id-ID",
  "pl-PL",
  "ja-JP",
  "zh-TW",
  "zh-CN",
  "ko-KR",
  "th-TH",
  "nl-NL",
  "hu-HU",
  "vi-VN",
  "cs-CZ",
  "da-DK",
  "fi-FI",
  "uk-UA",
  "el-GR",
  "ro-RO",
  "nb-NO",
  "sk-SK",
  "tr-TR",
  "ru-RU",
]);

export const photoSearchInputSchema = z.object({
  query: assetSearchQuerySchema,
  orientation: photoOrientationSchema.optional(),
  size: photoSizeSchema.optional(),
  color: photoColorSchema.optional(),
  locale: photoLocaleSchema.optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(80).default(24),
});

export const photoSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  insertImageUrl: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  avgColor: z.string(),
  photoUrl: z.string(),
  photographer: z.string(),
  photographerUrl: z.string(),
  metadata: z.record(z.string(), z.string()),
});

export const photoSearchResponseSchema = z.object({
  results: z.array(photoSearchResultSchema),
  page: z.number().int(),
  perPage: z.number().int(),
  totalResults: z.number().int(),
  hasNextPage: z.boolean(),
});

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
