import { BrandProfileNotFoundError } from "../domain/errors";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class ArchiveBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: { userId: string; profileId: string }) {
    const archived = await this.repo.archive(input);
    if (!archived) {
      throw new BrandProfileNotFoundError();
    }
    return archived;
  }
}
