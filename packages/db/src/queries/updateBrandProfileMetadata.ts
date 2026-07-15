import { and, eq } from "drizzle-orm";

import { brandProfiles } from "../schema/brand-profiles";
import type { Transaction } from "../transaction";

export async function updateBrandProfileMetadata({
  tx,
  profileId,
  userId,
  name,
  description,
}: {
  tx: Transaction;
  profileId: string;
  userId: string;
  name?: string;
  description?: string | null;
}) {
  const [row] = await tx
    .update(brandProfiles)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(brandProfiles.id, profileId), eq(brandProfiles.userId, userId)))
    .returning({ id: brandProfiles.id });

  return row ?? null;
}
