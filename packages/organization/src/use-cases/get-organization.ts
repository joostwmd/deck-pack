import { OrganizationNotFoundError } from "../domain/errors";
import type { OrganizationDetail } from "../domain/organization";
import type { OrganizationRepository } from "../repositories/organization-repository";

export class GetOrganization {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: { organizationId: string }): Promise<OrganizationDetail> {
    const org = await this.repo.findById(input.organizationId);
    if (!org) {
      throw new OrganizationNotFoundError(input.organizationId);
    }
    return org;
  }
}
