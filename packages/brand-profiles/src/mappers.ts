import {
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/brand-compliance";

import type { BrandProfileListRow, BrandProfileWithVersion } from "./domain/brand-profile";

export function mapBrandProfileSummary(row: BrandProfileListRow) {
  return brandProfileSummarySchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    isDefault: row.isDefault,
    activeVersionId: row.activeVersionId,
    versionNumber: row.versionNumber,
    schemaVersion: row.schemaVersion,
    configuration: row.configuration
      ? normalizeBrandProfileConfiguration(brandProfileConfigurationSchema.parse(row.configuration))
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapBrandProfileDetail(loaded: BrandProfileWithVersion) {
  return brandProfileDetailSchema.parse({
    id: loaded.profile.id,
    name: loaded.profile.name,
    description: loaded.profile.description,
    isDefault: loaded.profile.isDefault,
    activeVersionId: loaded.profile.activeVersionId,
    createdAt: loaded.profile.createdAt,
    updatedAt: loaded.profile.updatedAt,
    version: loaded.version
      ? {
          id: loaded.version.id,
          version: loaded.version.version,
          schemaVersion: loaded.version.schemaVersion,
          configuration: normalizeBrandProfileConfiguration(
            brandProfileConfigurationSchema.parse(loaded.version.configuration),
          ),
          createdAt: loaded.version.createdAt,
        }
      : null,
  });
}
