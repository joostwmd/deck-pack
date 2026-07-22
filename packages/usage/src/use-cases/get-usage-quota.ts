import { NotFoundError } from "@deck-pack/errors";

import { PLAN_LIMIT_ASSET_TYPES, type UsageQuota } from "../domain/usage";
import type { UsageRepository } from "../repositories/usage-repository";

export class GetUsageQuota {
  constructor(private readonly repo: UsageRepository) {}

  async execute(input: { organizationId: string }): Promise<UsageQuota> {
    const subscription = await this.repo.getActiveSubscription(input.organizationId);
    if (!subscription) {
      throw new NotFoundError("No active subscription");
    }

    const plan = await this.repo.getPlan(subscription.planId);
    if (!plan) {
      throw new NotFoundError("Plan not found");
    }

    const window = await this.repo.getEntitlementWindow(input.organizationId);
    const counts = await this.repo.countByAssetType({
      organizationId: input.organizationId,
      periodStart: window.start,
      periodEnd: window.end,
    });
    const countByType = new Map(counts.map((row) => [row.assetType, row.count]));

    const items = PLAN_LIMIT_ASSET_TYPES.map((assetType) => {
      const limitRow = plan.limits.find((limit) => limit.assetType === assetType);
      const limit = limitRow?.insertsPerMonth ?? null;
      const used = countByType.get(assetType) ?? 0;
      const remaining = limit === null ? null : Math.max(limit - used, 0);
      return { assetType, used, limit, remaining };
    });

    return {
      periodStart: window.start,
      periodEnd: window.end,
      periodLabel: window.label,
      items,
    };
  }
}
