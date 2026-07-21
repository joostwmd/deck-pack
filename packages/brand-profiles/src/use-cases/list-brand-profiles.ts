import { mapBrandProfileSummary } from "../mappers";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class ListBrandProfiles {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: { userId: string }) {
    const rows = await this.repo.listByUser(input.userId);
    return rows.map(mapBrandProfileSummary);
  }
}
