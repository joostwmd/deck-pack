import { ConflictError, InvalidStateError } from "@deck-pack/errors";

import type { CreatePlanInput, Plan } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class CreatePlan {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: CreatePlanInput): Promise<Plan> {
    const result = await this.repo.createPlan(input);

    if (!result.ok) {
      if (result.reason === "invalid_limits") {
        throw new InvalidStateError(
          "Provide a non-negative insert limit (or null for unlimited) for every asset type",
        );
      }
      throw new ConflictError("A plan with this slug already exists");
    }

    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      limits: result.limits,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
