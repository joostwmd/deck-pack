import type { CreateOrganizationInput, CreateOrganizationResult } from "../domain/organization";
import type { OrganizationRepository } from "../repositories/organization-repository";

export class CreateOrganization {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: CreateOrganizationInput): Promise<CreateOrganizationResult> {
    return this.repo.create({
      ...input,
      type: input.type ?? "team",
    });
  }
}
