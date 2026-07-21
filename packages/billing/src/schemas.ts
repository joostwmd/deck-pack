import { z } from "zod";

import { PLAN_LIMIT_ASSET_TYPES } from "./domain/billing";

export const planLimitAssetTypeSchema = z.enum(PLAN_LIMIT_ASSET_TYPES);

export const planSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const planLimitSchema = z.object({
  assetType: planLimitAssetTypeSchema,
  /** Null means unlimited inserts for this asset class. */
  insertsPerMonth: z.number().int().nonnegative().nullable(),
});

export const planLimitsInputSchema = z
  .array(planLimitSchema)
  .length(PLAN_LIMIT_ASSET_TYPES.length)
  .superRefine((limits, ctx) => {
    const seen = new Set<string>();
    for (const limit of limits) {
      if (seen.has(limit.assetType)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate limit for asset type ${limit.assetType}`,
        });
        return;
      }
      seen.add(limit.assetType);
    }
    for (const assetType of PLAN_LIMIT_ASSET_TYPES) {
      if (!seen.has(assetType)) {
        ctx.addIssue({
          code: "custom",
          message: `Missing limit for asset type ${assetType}`,
        });
        return;
      }
    }
  });

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  limits: z.array(planLimitSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const organizationSubscriptionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string(),
  planId: z.string(),
  planName: z.string(),
  planSlug: z.string(),
  quantity: z.number().int(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const subscriptionMutationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  planId: z.string(),
  quantity: z.number().int(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
