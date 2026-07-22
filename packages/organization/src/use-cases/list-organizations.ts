import type { OrganizationRepository } from "../repositories/organization-repository";
import type { OrganizationSummary } from "../domain/organization";

export class ListOrganizations {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(): Promise<OrganizationSummary[]> {
    return this.repo.list();
  }
}
