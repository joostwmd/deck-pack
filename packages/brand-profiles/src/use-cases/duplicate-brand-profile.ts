import {
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/presentation-check";

import { BrandProfileNotFoundError } from "../domain/errors";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class DuplicateBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: { userId: string; profileId: string; name: string }) {
    const duplicated = await this.repo.duplicate(input);
    if (!duplicated) {
      throw new BrandProfileNotFoundError();
    }

    return brandProfileDetailSchema.parse({
      id: duplicated.profile.id,
      name: duplicated.profile.name,
      description: duplicated.profile.description,
      isDefault: duplicated.profile.isDefault,
      activeVersionId: duplicated.profile.activeVersionId,
      createdAt: duplicated.profile.createdAt,
      updatedAt: duplicated.profile.updatedAt,
      version: {
        id: duplicated.version.id,
        version: duplicated.version.version,
        schemaVersion: duplicated.version.schemaVersion,
        configuration: normalizeBrandProfileConfiguration(
          brandProfileConfigurationSchema.parse(duplicated.version.configuration),
        ),
        createdAt: duplicated.version.createdAt,
      },
    });
  }
}
