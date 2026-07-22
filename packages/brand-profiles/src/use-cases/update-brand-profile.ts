import {
  brandProfileDetailSchema,
  normalizeBrandProfileConfiguration,
  type BrandProfileConfigurationInput,
} from "@deck-pack/brand-compliance";

import { BrandProfileNotFoundError } from "../domain/errors";
import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class UpdateBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: {
    userId: string;
    profileId: string;
    name?: string;
    description?: string | null;
    configuration: BrandProfileConfigurationInput;
  }) {
    const configuration = normalizeBrandProfileConfiguration(input.configuration);
    const version = await this.repo.appendVersion({
      userId: input.userId,
      profileId: input.profileId,
      configuration,
    });

    if (!version) {
      throw new BrandProfileNotFoundError();
    }

    if (input.name !== undefined || input.description !== undefined) {
      await this.repo.updateMetadata({
        userId: input.userId,
        profileId: input.profileId,
        name: input.name,
        description: input.description,
      });
    }

    const loaded = await this.repo.getWithVersion({
      userId: input.userId,
      profileId: input.profileId,
    });

    if (!loaded) {
      throw new BrandProfileNotFoundError();
    }

    return brandProfileDetailSchema.parse({
      id: loaded.profile.id,
      name: input.name ?? loaded.profile.name,
      description: input.description ?? loaded.profile.description,
      isDefault: loaded.profile.isDefault,
      activeVersionId: loaded.profile.activeVersionId,
      createdAt: loaded.profile.createdAt,
      updatedAt: loaded.profile.updatedAt,
      version: {
        id: version.id,
        version: version.version,
        schemaVersion: version.schemaVersion,
        configuration,
        createdAt: version.createdAt,
      },
    });
  }
}
