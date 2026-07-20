import { eq } from "drizzle-orm";

import { user } from "../schema/auth";
import type { Transaction } from "../transaction";

export type DeleteUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" };

/**
 * Hard-deletes a user. Sessions, accounts, memberships, and other user-owned
 * rows cascade via FK.
 */
export async function deleteUser({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<DeleteUserResult> {
  const [existing] = await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existing) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await tx.delete(user).where(eq(user.id, userId));

  return { ok: true as const, userId };
}
