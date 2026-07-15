import { and, eq, isNull } from "drizzle-orm";

import { brandProfileVersions, brandProfiles } from "../schema/brand-profiles";
import type { Transaction } from "../transaction";

export async function getBrandProfileWithVersion({
  tx,
  profileId,
  userId,
  versionId,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
  versionId?: string;
}) {
  const [profile] = await tx
    .select({
      id: brandProfiles.id,
      userId: brandProfiles.userId,
      name: brandProfiles.name,
      description: brandProfiles.description,
      isDefault: brandProfiles.isDefault,
      activeVersionId: brandProfiles.activeVersionId,
      createdAt: brandProfiles.createdAt,
      updatedAt: brandProfiles.updatedAt,
    })
    .from(brandProfiles)
    .where(
      and(
        eq(brandProfiles.id, profileId),
        eq(brandProfiles.userId, userId),
        isNull(brandProfiles.archivedAt),
      ),
    )
    .limit(1);

  if (!profile) {
    return null;
  }

  const targetVersionId = versionId ?? profile.activeVersionId;
  if (!targetVersionId) {
    return { profile, version: null };
  }

  const [version] = await tx
    .select({
      id: brandProfileVersions.id,
      profileId: brandProfileVersions.profileId,
      version: brandProfileVersions.version,
      schemaVersion: brandProfileVersions.schemaVersion,
      configuration: brandProfileVersions.configuration,
      createdByUserId: brandProfileVersions.createdByUserId,
      createdAt: brandProfileVersions.createdAt,
    })
    .from(brandProfileVersions)
    .where(
      and(
        eq(brandProfileVersions.id, targetVersionId),
        eq(brandProfileVersions.profileId, profileId),
      ),
    )
    .limit(1);

  return { profile, version: version ?? null };
}
