import { shortcutOverrides } from "../schema/shortcut-overrides";
import type { Transaction } from "../transaction";

export type UpsertShortcutOverrideInput = {
  userId: string;
  shortcutId: string;
  hotkey: string;
  schemaVersion: number;
};

export async function upsertShortcutOverride({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpsertShortcutOverrideInput;
}) {
  const [row] = await tx
    .insert(shortcutOverrides)
    .values({
      userId: input.userId,
      shortcutId: input.shortcutId,
      hotkey: input.hotkey,
      schemaVersion: input.schemaVersion,
    })
    .onConflictDoUpdate({
      target: [
        shortcutOverrides.userId,
        shortcutOverrides.shortcutId,
        shortcutOverrides.schemaVersion,
      ],
      set: {
        hotkey: input.hotkey,
        updatedAt: new Date(),
      },
    })
    .returning({
      shortcutId: shortcutOverrides.shortcutId,
      hotkey: shortcutOverrides.hotkey,
      schemaVersion: shortcutOverrides.schemaVersion,
      updatedAt: shortcutOverrides.updatedAt,
    });

  return row ?? null;
}
