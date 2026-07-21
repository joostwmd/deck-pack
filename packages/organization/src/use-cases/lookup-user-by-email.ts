import type { OrganizationRepository } from "../repositories/organization-repository";
import type { UserLookup } from "../domain/organization";

export class LookupUserByEmail {
  constructor(private readonly repo: OrganizationRepository) {}

  async execute(input: { email: string }): Promise<UserLookup> {
    return this.repo.findUserByEmail(input.email);
  }
}
