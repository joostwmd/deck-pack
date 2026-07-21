import { z } from "zod";

import { assetClientSchema, assetExternalIdSchema, assetTypeSchema } from "../assets/schemas";

export const trackAssetInsertionInputSchema = z.object({
  assetType: assetTypeSchema,
  externalId: assetExternalIdSchema,
  client: assetClientSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const trackAssetInsertionOutputSchema = z.object({
  id: z.string(),
});

export {
  assetClientSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetTypeSchema,
} from "../assets/schemas";

export {
  photoColorSchema,
  photoLocaleSchema,
  photoOrientationSchema,
  photoSearchInputSchema,
  photoSizeSchema,
} from "@deck-pack/photos/schemas";

export {
  shapeSearchInputSchema,
  slideAspectRatioSchema,
  slideSearchInputSchema,
  slideSortSchema,
} from "@deck-pack/gallery/schemas";
