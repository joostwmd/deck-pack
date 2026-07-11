import { and, eq, isNull } from "drizzle-orm";

import { brandProfiles } from "../schema/brand-profiles";
import type { Transaction } from "../transaction";

export async function isBrandProfileOwner({
  tx,
  profileId,
  userId,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
}): Promise<boolean> {
  const [row] = await tx
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(
      and(
        eq(brandProfiles.id, profileId),
        eq(brandProfiles.userId, userId),
        isNull(brandProfiles.archivedAt),
      ),
    )
    .limit(1);

  return row !== undefined;
}
