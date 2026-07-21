import { ConflictError, NotFoundError } from "@deck-pack/errors";

import type {
  CreateOrganizationSubscriptionInput,
  SubscriptionMutationResult,
} from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class CreateOrganizationSubscription {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: CreateOrganizationSubscriptionInput): Promise<SubscriptionMutationResult> {
    const result = await this.repo.createOrganizationSubscription(input);

    if (!result.ok) {
      if (result.reason === "organization_not_found") {
        throw new NotFoundError("Organization not found");
      }
      if (result.reason === "plan_not_found") {
        throw new NotFoundError("Plan not found");
      }
      throw new ConflictError("This organization already has an active subscription");
    }

    return {
      id: result.id,
      organizationId: result.organizationId,
      planId: result.planId,
      quantity: result.quantity,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
