import { and, eq } from "drizzle-orm";

import { shortcutOverrides } from "../schema/shortcut-overrides";
import type { Transaction } from "../transaction";

export async function listShortcutOverridesByUser({
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

  return tx
    .select({
      shortcutId: shortcutOverrides.shortcutId,
      hotkey: shortcutOverrides.hotkey,
      schemaVersion: shortcutOverrides.schemaVersion,
      updatedAt: shortcutOverrides.updatedAt,
    })
    .from(shortcutOverrides)
    .where(and(...conditions));
}

export async function listAllShortcutOverridesByUser({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}) {
  return listShortcutOverridesByUser({ tx, userId });
}
