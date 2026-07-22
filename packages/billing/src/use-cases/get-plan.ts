import { NotFoundError } from "@deck-pack/errors";

import type { Plan } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class GetPlan {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: { planId: string }): Promise<Plan> {
    const row = await this.repo.getPlan(input.planId);
    if (!row) {
      throw new NotFoundError("Plan not found");
    }
    return row;
  }
}
