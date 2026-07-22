import { workspaceFromOrganizationType } from "@deck-pack/auth/workspace";
import { NotFoundError } from "@deck-pack/errors";

import type { OrganizationProfile } from "../domain/member";
import type { MembersRepository } from "../repositories/members-repository";

export class GetOrganizationProfile {
  constructor(private readonly repo: MembersRepository) {}

  async execute(input: { organizationId: string }): Promise<OrganizationProfile> {
    const org = await this.repo.getOrganizationMetadata(input.organizationId);
    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    const subscription = await this.repo.getActiveSubscription(input.organizationId);

    let plan: OrganizationProfile["plan"] = null;
    if (subscription) {
      const planRow = await this.repo.getPlan(subscription.planId);
      if (planRow) {
        plan = {
          id: planRow.id,
          name: planRow.name,
          slug: planRow.slug,
          quantity: subscription.quantity,
        };
      }
    }

    return {
      type: org.type,
      workspace: workspaceFromOrganizationType(org.type),
      plan,
    };
  }
}
