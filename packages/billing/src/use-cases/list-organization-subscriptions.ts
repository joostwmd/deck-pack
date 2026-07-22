import type { OrganizationSubscription } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class ListOrganizationSubscriptions {
  constructor(private readonly repo: BillingRepository) {}

  async execute(): Promise<OrganizationSubscription[]> {
    return this.repo.listOrganizationSubscriptions();
  }
}
