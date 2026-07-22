import type { OrganizationRepository } from "../repositories/organization-repository";

export class DeleteOrganization {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: { organizationId: string }): Promise<{ organizationId: string }> {
    return this.repo.delete(input.organizationId);
  }
}
