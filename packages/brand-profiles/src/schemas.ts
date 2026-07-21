import { z } from "zod";

import { brandProfileConfigurationSchema } from "@deck-pack/brand-compliance";

export {
  BRAND_PROFILE_SCHEMA_VERSION,
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/brand-compliance";

export const profileIdSchema = z.object({ profileId: z.string().uuid() });

export const createBrandProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
  configuration: brandProfileConfigurationSchema,
});

export const updateBrandProfileInputSchema = profileIdSchema.extend({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  configuration: brandProfileConfigurationSchema,
});

export const duplicateBrandProfileInputSchema = profileIdSchema.extend({
  name: z.string().trim().min(1).max(120),
});

export const getBrandProfileInputSchema = profileIdSchema.extend({
  versionId: z.string().uuid().optional(),
});

export const setDefaultResultSchema = z.object({
  id: z.string(),
  isDefault: z.boolean(),
});

export const archiveResultSchema = z.object({
  id: z.string(),
});
