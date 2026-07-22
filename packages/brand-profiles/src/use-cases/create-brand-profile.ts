import {
  brandProfileDetailSchema,
  normalizeBrandProfileConfiguration,
  type BrandProfileConfigurationInput,
} from "@deck-pack/brand-compliance";

import type { BrandProfilesRepository } from "../repositories/brand-profiles-repository";

export class CreateBrandProfile {
  constructor(private readonly repo: BrandProfilesRepository) {}

  async execute(input: {
    userId: string;
    name: string;
    description?: string | null;
    isDefault?: boolean;
    configuration: BrandProfileConfigurationInput;
  }) {
    const configuration = normalizeBrandProfileConfiguration(input.configuration);
    const created = await this.repo.create({
      userId: input.userId,
      name: input.name,
      description: input.description,
      isDefault: input.isDefault,
      configuration,
    });

    return brandProfileDetailSchema.parse({
      id: created.profile.id,
      name: created.profile.name,
      description: created.profile.description,
      isDefault: created.profile.isDefault,
      activeVersionId: created.profile.activeVersionId,
      createdAt: created.profile.createdAt,
      updatedAt: created.profile.updatedAt,
      version: {
        id: created.version.id,
        version: created.version.version,
        schemaVersion: created.version.schemaVersion,
        configuration,
        createdAt: created.version.createdAt,
      },
    });
  }
}
