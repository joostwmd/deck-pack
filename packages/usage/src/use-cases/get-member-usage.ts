import { resolveUsagePeriod, type UsagePeriodInput } from "../period";

import type { MemberUsage } from "../domain/usage";
import type { UsageRepository } from "../repositories/usage-repository";

export class GetMemberUsage {
  constructor(private readonly repo: UsageRepository) {}

  async execute(input: {
    organizationId: string;
    userId: string;
    period: UsagePeriodInput;
  }): Promise<MemberUsage> {
    const ctx = await this.repo.getUsagePeriodContext(input.organizationId);
    const resolved = resolveUsagePeriod(input.period, ctx);
    const counts = await this.repo.countByAssetType({
      organizationId: input.organizationId,
      userId: input.userId,
      periodStart: resolved.start,
      periodEnd: resolved.end,
    });
    const points = await this.repo.listSeries({
      organizationId: input.organizationId,
      userId: input.userId,
      periodStart: resolved.start,
      periodEnd: resolved.end,
    });

    return {
      userId: input.userId,
      periodStart: resolved.start,
      periodEnd: resolved.end,
      periodLabel: resolved.label,
      totalUsed: counts.reduce((sum, row) => sum + row.count, 0),
      byAssetType: counts,
      points,
    };
  }
}
