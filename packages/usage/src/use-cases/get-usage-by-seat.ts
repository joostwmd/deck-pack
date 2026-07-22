import { resolveUsagePeriod, type UsagePeriodInput } from "../period";

import type { UsageBySeat } from "../domain/usage";
import type { UsageRepository } from "../repositories/usage-repository";

export class GetUsageBySeat {
  constructor(private readonly repo: UsageRepository) {}

  async execute(input: { organizationId: string; period: UsagePeriodInput }): Promise<UsageBySeat> {
    const ctx = await this.repo.getUsagePeriodContext(input.organizationId);
    const resolved = resolveUsagePeriod(input.period, ctx);
    const seats = await this.repo.listSeatUsage({
      organizationId: input.organizationId,
      periodStart: resolved.start,
      periodEnd: resolved.end,
    });

    return {
      periodStart: resolved.start,
      periodEnd: resolved.end,
      periodLabel: resolved.label,
      seats,
    };
  }
}
