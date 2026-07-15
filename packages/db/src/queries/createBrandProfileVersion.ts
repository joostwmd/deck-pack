import { and, desc, eq } from "drizzle-orm";

import { brandProfileVersions, brandProfiles } from "../schema/brand-profiles";
import { withTransaction } from "../transaction";
import type { Transaction } from "../transaction";

export async function createBrandProfileVersion({
  tx,
  profileId,
  userId,
  configuration,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
  configuration: Record<string, unknown>;
}) {
  return withTransaction(async () => {
    const [profile] = await tx
      .select({ id: brandProfiles.id })
      .from(brandProfiles)
      .where(and(eq(brandProfiles.id, profileId), eq(brandProfiles.userId, userId)))
      .limit(1);

    if (!profile) {
      return null;
    }

    const [latest] = await tx
      .select({ version: brandProfileVersions.version })
      .from(brandProfileVersions)
      .where(eq(brandProfileVersions.profileId, profileId))
      .orderBy(desc(brandProfileVersions.version))
      .limit(1);

    const nextVersion = (latest?.version ?? 0) + 1;

    const [version] = await tx
      .insert(brandProfileVersions)
      .values({
        profileId,
        version: nextVersion,
        schemaVersion: 1,
        configuration,
        createdByUserId: userId,
      })
      .returning({
        id: brandProfileVersions.id,
        profileId: brandProfileVersions.profileId,
        version: brandProfileVersions.version,
        schemaVersion: brandProfileVersions.schemaVersion,
        configuration: brandProfileVersions.configuration,
        createdByUserId: brandProfileVersions.createdByUserId,
        createdAt: brandProfileVersions.createdAt,
      });

    await tx
      .update(brandProfiles)
      .set({ activeVersionId: version!.id, updatedAt: new Date() })
      .where(eq(brandProfiles.id, profileId));

    return version!;
  });
}
