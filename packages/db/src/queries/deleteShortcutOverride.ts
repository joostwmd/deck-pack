import { and, eq } from "drizzle-orm";

import { shortcutOverrides } from "../schema/shortcut-overrides";
import type { Transaction } from "../transaction";

export async function deleteShortcutOverride({
  tx,
  userId,
  shortcutId,
  schemaVersion,
}: {
  tx: Transaction;
  userId: string;
  shortcutId: string;
  schemaVersion: number;
}) {
  const [deleted] = await tx
    .delete(shortcutOverrides)
    .where(
      and(
        eq(shortcutOverrides.userId, userId),
        eq(shortcutOverrides.shortcutId, shortcutId),
        eq(shortcutOverrides.schemaVersion, schemaVersion),
      ),
    )
    .returning({ shortcutId: shortcutOverrides.shortcutId });

  return deleted ?? null;
}
