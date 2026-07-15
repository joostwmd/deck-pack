import { and, eq } from "drizzle-orm";

import { brandProfiles } from "../schema/brand-profiles";
import { withTransaction } from "../transaction";
import type { Transaction } from "../transaction";

export async function setDefaultBrandProfile({
  tx,
  profileId,
  userId,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
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

    await tx
      .update(brandProfiles)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(brandProfiles.userId, userId));

    const [updated] = await tx
      .update(brandProfiles)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(brandProfiles.id, profileId))
      .returning({
        id: brandProfiles.id,
        isDefault: brandProfiles.isDefault,
      });

    return updated ?? null;
  });
}
