import { and, eq } from "drizzle-orm";

import { brandProfileVersions, brandProfiles } from "../schema/brand-profiles";
import { withTransaction } from "../transaction";
import type { Transaction } from "../transaction";

export type CreateBrandProfileInput = {
  userId: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  configuration: Record<string, unknown>;
};

export async function createBrandProfile({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateBrandProfileInput;
}) {
  return withTransaction(async () => {
    if (input.isDefault) {
      await tx
        .update(brandProfiles)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(brandProfiles.userId, input.userId));
    }

    const [profile] = await tx
      .insert(brandProfiles)
      .values({
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        isDefault: input.isDefault ?? false,
      })
      .returning({
        id: brandProfiles.id,
        userId: brandProfiles.userId,
        name: brandProfiles.name,
        description: brandProfiles.description,
        isDefault: brandProfiles.isDefault,
        activeVersionId: brandProfiles.activeVersionId,
        createdAt: brandProfiles.createdAt,
        updatedAt: brandProfiles.updatedAt,
      });

    const [version] = await tx
      .insert(brandProfileVersions)
      .values({
        profileId: profile!.id,
        version: 1,
        schemaVersion: 1,
        configuration: input.configuration,
        createdByUserId: input.userId,
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

    const [updatedProfile] = await tx
      .update(brandProfiles)
      .set({ activeVersionId: version!.id, updatedAt: new Date() })
      .where(eq(brandProfiles.id, profile!.id))
      .returning({
        id: brandProfiles.id,
        userId: brandProfiles.userId,
        name: brandProfiles.name,
        description: brandProfiles.description,
        isDefault: brandProfiles.isDefault,
        activeVersionId: brandProfiles.activeVersionId,
        createdAt: brandProfiles.createdAt,
        updatedAt: brandProfiles.updatedAt,
      });

    return { profile: updatedProfile!, version: version! };
  });
}

export async function duplicateBrandProfile({
  tx,
  profileId,
  userId,
  name,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
  name: string;
}) {
  const existing = await tx
    .select({
      profile: brandProfiles,
      version: brandProfileVersions,
    })
    .from(brandProfiles)
    .innerJoin(
      brandProfileVersions,
      eq(brandProfiles.activeVersionId, brandProfileVersions.id),
    )
    .where(and(eq(brandProfiles.id, profileId), eq(brandProfiles.userId, userId)))
    .limit(1);

  const row = existing[0];
  if (!row) {
    return null;
  }

  return createBrandProfile({
    tx,
    input: {
      userId,
      name,
      description: row.profile.description,
      configuration: row.version.configuration,
    },
  });
}
