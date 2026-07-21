import { NotFoundError } from "@deck-pack/errors";

import type { OrganizationSubscription } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class GetOrganizationSubscription {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: { subscriptionId: string }): Promise<OrganizationSubscription> {
    const row = await this.repo.getOrganizationSubscription(input.subscriptionId);
    if (!row) {
      throw new NotFoundError("Subscription not found");
    }
    return row;
  }
}
