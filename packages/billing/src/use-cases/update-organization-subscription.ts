import { ConflictError, NotFoundError } from "@deck-pack/errors";

import type {
  SubscriptionMutationResult,
  UpdateOrganizationSubscriptionInput,
} from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class UpdateOrganizationSubscription {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: UpdateOrganizationSubscriptionInput): Promise<SubscriptionMutationResult> {
    const result = await this.repo.updateOrganizationSubscription(input);

    if (!result.ok) {
      if (result.reason === "plan_not_found") {
        throw new NotFoundError("Plan not found");
      }
      if (result.reason === "already_subscribed") {
        throw new ConflictError("This organization already has an active subscription");
      }
      throw new NotFoundError("Subscription not found");
    }

    return {
      id: result.id,
      organizationId: result.organizationId,
      planId: result.planId,
      quantity: result.quantity,
      status: result.status,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
