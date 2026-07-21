import { resolveUsagePeriod, type UsagePeriodInput } from "../period";

import type { UsageSeries } from "../domain/usage";
import type { UsageRepository } from "../repositories/usage-repository";

export class GetUsageSeries {
  constructor(private readonly repo: UsageRepository) {}

  async execute(input: { organizationId: string; period: UsagePeriodInput }): Promise<UsageSeries> {
    const ctx = await this.repo.getUsagePeriodContext(input.organizationId);
    const resolved = resolveUsagePeriod(input.period, ctx);
    const points = await this.repo.listSeries({
      organizationId: input.organizationId,
      periodStart: resolved.start,
      periodEnd: resolved.end,
    });

    return {
      periodStart: resolved.start,
      periodEnd: resolved.end,
      periodLabel: resolved.label,
      points,
    };
  }
}
