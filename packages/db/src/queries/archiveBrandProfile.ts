import { and, eq } from "drizzle-orm";

import { brandProfiles } from "../schema/brand-profiles";
import type { Transaction } from "../transaction";

export async function archiveBrandProfile({
  tx,
  profileId,
  userId,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
}) {
  const [row] = await tx
    .update(brandProfiles)
    .set({
      archivedAt: new Date(),
      isDefault: false,
      updatedAt: new Date(),
    })
    .where(and(eq(brandProfiles.id, profileId), eq(brandProfiles.userId, userId)))
    .returning({ id: brandProfiles.id });

  return row ?? null;
}
