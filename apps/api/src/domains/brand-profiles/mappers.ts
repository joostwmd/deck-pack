import {
  BRAND_PROFILE_SCHEMA_VERSION,
  brandProfileConfigurationSchema,
  brandProfileDetailSchema,
  brandProfileSummarySchema,
  normalizeBrandProfileConfiguration,
} from "@deck-pack/presentation-check";

import type { listBrandProfilesByUser } from "@deck-pack/db/queries/listBrandProfilesByUser";
import type { getBrandProfileWithVersion } from "@deck-pack/db/queries/getBrandProfileWithVersion";

export function mapBrandProfileSummary(
  row: Awaited<ReturnType<typeof listBrandProfilesByUser>>[number],
) {
  return brandProfileSummarySchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    isDefault: row.isDefault,
    activeVersionId: row.activeVersionId,
    versionNumber: row.versionNumber,
    schemaVersion: row.schemaVersion,
    configuration: row.configuration
      ? normalizeBrandProfileConfiguration(
          brandProfileConfigurationSchema.parse(row.configuration),
        )
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function mapBrandProfileDetail(loaded: NonNullable<
  Awaited<ReturnType<typeof getBrandProfileWithVersion>>
>) {
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

export { BRAND_PROFILE_SCHEMA_VERSION };
