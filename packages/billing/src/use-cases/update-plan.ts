import { ConflictError, InvalidStateError, NotFoundError } from "@deck-pack/errors";

import type { Plan, UpdatePlanInput } from "../domain/billing";
import type { BillingRepository } from "../repositories/billing-repository";

export class UpdatePlan {
  constructor(private readonly repo: BillingRepository) {}

  async execute(input: UpdatePlanInput): Promise<Plan> {
    const result = await this.repo.updatePlan(input);

    if (!result.ok) {
      if (result.reason === "not_found") {
        throw new NotFoundError("Plan not found");
      }
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
