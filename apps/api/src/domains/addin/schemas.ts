import { z } from "zod";

import {
  assetClientSchema,
  assetExternalIdSchema,
  assetSearchQuerySchema,
  assetTypeSchema,
} from "../assets/schemas";

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
} from "../photos/schemas";

export {
  slideAspectRatioSchema,
  slideSearchInputSchema,
  slideSortSchema,
} from "../slides/schemas";

export { shapeSearchInputSchema } from "../shapes/schemas";
