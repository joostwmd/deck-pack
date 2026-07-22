import { BrandProfileNotFoundError } from "../domain/errors";
import { mapBrandProfileDetail } from "../mappers";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class GetBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: { userId: string; profileId: string; versionId?: string }) {
    const loaded = await this.repo.getWithVersion(input);
    if (!loaded) throw new BrandProfileNotFoundError();
    return mapBrandProfileDetail(loaded);
  }
}
