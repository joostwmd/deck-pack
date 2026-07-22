import { OrganizationNotFoundError } from "../domain/errors";
import type { OrganizationMember } from "../domain/organization";
import type { OrganizationRepository } from "../repositories/organization-repository";

export class ListOrganizationMembers {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: { organizationId: string }): Promise<OrganizationMember[]> {
    const org = await this.repo.findById(input.organizationId);
    if (!org) {
      throw new OrganizationNotFoundError(input.organizationId);
    }
    return this.repo.listMembers(input.organizationId);
  }
}
