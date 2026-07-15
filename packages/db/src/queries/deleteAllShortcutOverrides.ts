import { and, eq } from "drizzle-orm";

import { shortcutOverrides } from "../schema/shortcut-overrides";
import type { Transaction } from "../transaction";

export async function deleteAllShortcutOverrides({
  tx,
  userId,
  schemaVersion,
}: {
  tx: Transaction;
  userId: string;
  schemaVersion?: number;
}) {
  const conditions = [eq(shortcutOverrides.userId, userId)];

  if (schemaVersion !== undefined) {
    conditions.push(eq(shortcutOverrides.schemaVersion, schemaVersion));
  }

  const deleted = await tx
    .delete(shortcutOverrides)
    .where(and(...conditions))
    .returning({ id: shortcutOverrides.id });

  return deleted.length;
}
