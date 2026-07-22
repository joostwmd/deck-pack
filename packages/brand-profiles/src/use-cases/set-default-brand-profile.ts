import { BrandProfileNotFoundError } from "../domain/errors";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class SetDefaultBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: { userId: string; profileId: string }) {
    const updated = await this.repo.setDefault(input);
    if (!updated) {
      throw new BrandProfileNotFoundError();
    }
    return updated;
  }
}
