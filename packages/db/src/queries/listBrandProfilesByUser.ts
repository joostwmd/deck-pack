import { and, desc, eq, isNull } from "drizzle-orm";

import { brandProfileVersions, brandProfiles } from "../schema/brand-profiles";
import type { Transaction } from "../transaction";

export async function listBrandProfilesByUser({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}) {
  const rows = await tx
    .select({
      id: brandProfiles.id,
      name: brandProfiles.name,
      description: brandProfiles.description,
      isDefault: brandProfiles.isDefault,
      activeVersionId: brandProfiles.activeVersionId,
      createdAt: brandProfiles.createdAt,
      updatedAt: brandProfiles.updatedAt,
      versionNumber: brandProfileVersions.version,
      schemaVersion: brandProfileVersions.schemaVersion,
      configuration: brandProfileVersions.configuration,
    })
    .from(brandProfiles)
    .leftJoin(
      brandProfileVersions,
      eq(brandProfiles.activeVersionId, brandProfileVersions.id),
    )
    .where(and(eq(brandProfiles.userId, userId), isNull(brandProfiles.archivedAt)))
    .orderBy(desc(brandProfiles.isDefault), desc(brandProfiles.updatedAt));

  return rows;
}
