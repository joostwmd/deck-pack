import { PLAN_LIMIT_ASSET_TYPES } from "@deck-pack/db/schema/billing";
import { resolveUsagePeriod, type UsagePeriodInput } from "@deck-pack/db/usage-period";
import type { countInsertionsByAssetTypeForOrgPeriod } from "@deck-pack/db/queries/countInsertionsForOrgPeriod";
import type { listInsertionSeriesForOrg } from "@deck-pack/db/queries/listInsertionSeriesForOrg";
import type { listSeatUsageForOrg } from "@deck-pack/db/queries/listSeatUsageForOrg";
import type { getPlan } from "@deck-pack/db/queries/getPlan";
import type {
  getEntitlementWindow,
  getUsagePeriodContext,
} from "@deck-pack/db/queries/usage-entitlements";
import type { getActiveOrganizationSubscriptionByOrgId } from "@deck-pack/db/queries/getActiveOrganizationSubscriptionByOrgId";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

export type UsageServiceDeps = {
  getActiveOrganizationSubscriptionByOrgId: typeof getActiveOrganizationSubscriptionByOrgId;
  getPlan: typeof getPlan;
  getEntitlementWindow: typeof getEntitlementWindow;
  getUsagePeriodContext: typeof getUsagePeriodContext;
  countInsertionsByAssetTypeForOrgPeriod: typeof countInsertionsByAssetTypeForOrgPeriod;
  listInsertionSeriesForOrg: typeof listInsertionSeriesForOrg;
  listSeatUsageForOrg: typeof listSeatUsageForOrg;
};

export function createUsageService(deps: UsageServiceDeps) {
  return {
    quota: async (
      tx: Transaction,
      organizationId: string,
    ): Promise<
      ServiceResult<{
        periodStart: Date;
        periodEnd: Date;
        periodLabel: string;
        items: Array<{
          assetType: (typeof PLAN_LIMIT_ASSET_TYPES)[number];
          used: number;
          limit: number | null;
          remaining: number | null;
        }>;
      }>
    > => {
      const subscription = await deps.getActiveOrganizationSubscriptionByOrgId({
        tx,
        organizationId,
      });

      if (!subscription) {
        return serviceFail("not_found", { message: "No active subscription" });
      }

      const plan = await deps.getPlan({ tx, planId: subscription.planId });
      if (!plan) {
        return serviceFail("not_found", { message: "Plan not found" });
      }

      const window = await deps.getEntitlementWindow({ tx, organizationId });
      const counts = await deps.countInsertionsByAssetTypeForOrgPeriod({
        tx,
        input: {
          organizationId,
          periodStart: window.start,
          periodEnd: window.end,
        },
      });
      const countByType = new Map(counts.map((row) => [row.assetType, row.count]));

      const items = PLAN_LIMIT_ASSET_TYPES.map((assetType) => {
        const limitRow = plan.limits.find((limit) => limit.assetType === assetType);
        const limit = limitRow?.insertsPerMonth ?? null;
        const used = countByType.get(assetType) ?? 0;
        const remaining = limit === null ? null : Math.max(limit - used, 0);

        return { assetType, used, limit, remaining };
      });

      return serviceOk({
        periodStart: window.start,
        periodEnd: window.end,
        periodLabel: window.label,
        items,
      });
    },

    series: async (
      tx: Transaction,
      input: { organizationId: string; period: UsagePeriodInput },
    ) => {
      const ctx = await deps.getUsagePeriodContext({ tx, organizationId: input.organizationId });
      const resolved = resolveUsagePeriod(input.period, ctx);
      const points = await deps.listInsertionSeriesForOrg({
        tx,
        input: {
          organizationId: input.organizationId,
          periodStart: resolved.start,
          periodEnd: resolved.end,
        },
      });

      return serviceOk({
        periodStart: resolved.start,
        periodEnd: resolved.end,
        periodLabel: resolved.label,
        points,
      });
    },

    bySeat: async (
      tx: Transaction,
      input: { organizationId: string; period: UsagePeriodInput },
    ) => {
      const ctx = await deps.getUsagePeriodContext({ tx, organizationId: input.organizationId });
      const resolved = resolveUsagePeriod(input.period, ctx);
      const seats = await deps.listSeatUsageForOrg({
        tx,
        input: {
          organizationId: input.organizationId,
          periodStart: resolved.start,
          periodEnd: resolved.end,
        },
      });

      return serviceOk({
        periodStart: resolved.start,
        periodEnd: resolved.end,
        periodLabel: resolved.label,
        seats,
      });
    },

    member: async (
      tx: Transaction,
      input: { organizationId: string; userId: string; period: UsagePeriodInput },
    ) => {
      const ctx = await deps.getUsagePeriodContext({ tx, organizationId: input.organizationId });
      const resolved = resolveUsagePeriod(input.period, ctx);
      const counts = await deps.countInsertionsByAssetTypeForOrgPeriod({
        tx,
        input: {
          organizationId: input.organizationId,
          userId: input.userId,
          periodStart: resolved.start,
          periodEnd: resolved.end,
        },
      });
      const points = await deps.listInsertionSeriesForOrg({
        tx,
        input: {
          organizationId: input.organizationId,
          userId: input.userId,
          periodStart: resolved.start,
          periodEnd: resolved.end,
        },
      });

      const totalUsed = counts.reduce((sum, row) => sum + row.count, 0);

      return serviceOk({
        userId: input.userId,
        periodStart: resolved.start,
        periodEnd: resolved.end,
        periodLabel: resolved.label,
        totalUsed,
        byAssetType: counts,
        points,
      });
    },
  };
}

export type UsageService = ReturnType<typeof createUsageService>;
