import type { OrganizationType, UpdateOrganizationInput } from "../domain/organization";
import type { OrganizationRepository } from "../repositories/organization-repository";

export class UpdateOrganization {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: UpdateOrganizationInput): Promise<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    type: OrganizationType | null;
  }> {
    return this.repo.update(input);
  }
}
