import { USAGE_PERIOD_PRESETS } from "@deck-pack/db/usage-period";
import { PLAN_LIMIT_ASSET_TYPES } from "@deck-pack/db/schema/billing";
import { z } from "zod";

export const usagePeriodInputSchema = z.union([
  z.object({
    preset: z.enum(USAGE_PERIOD_PRESETS),
  }),
  z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
]);

export type UsagePeriodInput = z.infer<typeof usagePeriodInputSchema>;

export const usageQuotaItemSchema = z.object({
  assetType: z.enum(PLAN_LIMIT_ASSET_TYPES),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative().nullable(),
  remaining: z.number().int().nonnegative().nullable(),
});

export const usageQuotaOutputSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  periodLabel: z.string(),
  items: z.array(usageQuotaItemSchema),
});

export const usageSeriesPointSchema = z.object({
  date: z.string(),
  assetType: z.string(),
  count: z.number().int().nonnegative(),
});

export const usageSeriesOutputSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  periodLabel: z.string(),
  points: z.array(usageSeriesPointSchema),
});

export const seatUsageRowSchema = z.object({
  seatId: z.string(),
  userId: z.string().nullable(),
  email: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  totalUsed: z.number().int().nonnegative(),
  byAssetType: z.array(
    z.object({
      assetType: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const usageBySeatOutputSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  periodLabel: z.string(),
  seats: z.array(seatUsageRowSchema),
});

export const usageMemberOutputSchema = z.object({
  userId: z.string(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  periodLabel: z.string(),
  totalUsed: z.number().int().nonnegative(),
  byAssetType: z.array(
    z.object({
      assetType: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  points: z.array(usageSeriesPointSchema),
});
