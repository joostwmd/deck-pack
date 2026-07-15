import {
  SHORTCUT_DEFINITIONS,
  SHORTCUT_SCHEMA_VERSION,
  canonicalizeHotkey,
  findInternalConflict,
  getShortcutDefinition,
  migrateShortcutOverridesToCurrent,
  resolveShortcutRegistry,
  type ShortcutOverride,
} from "@deck-pack/shortcuts";
import { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";
import type { Transaction } from "@deck-pack/db/transaction";

export async function loadCurrentShortcutOverrides({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}): Promise<ShortcutOverride[]> {
  const rows = await listAllShortcutOverridesByUser({ tx, userId });

  const currentRows = rows.filter((row) => row.schemaVersion === SHORTCUT_SCHEMA_VERSION);
  if (currentRows.length > 0) {
    return currentRows.map((row) => ({
      shortcutId: row.shortcutId as ShortcutOverride["shortcutId"],
      hotkey: row.hotkey,
      schemaVersion: row.schemaVersion,
    }));
  }

  const versions = [...new Set(rows.map((row) => row.schemaVersion))].sort((a, b) => a - b);
  if (versions.length === 0) {
    return [];
  }

  const latestLegacyVersion = versions[versions.length - 1]!;
  const legacyRows = rows.filter((row) => row.schemaVersion === latestLegacyVersion);
  const migrated = migrateShortcutOverridesToCurrent(
    latestLegacyVersion,
    legacyRows.map((row) => ({
      shortcutId: row.shortcutId as ShortcutOverride["shortcutId"],
      hotkey: row.hotkey,
      schemaVersion: row.schemaVersion,
    })),
  );

  for (const override of migrated) {
    await upsertShortcutOverride({
      tx,
      input: {
        userId,
        shortcutId: override.shortcutId,
        hotkey: override.hotkey,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
      },
    });
  }

  return migrated.map((override) => ({
    ...override,
    schemaVersion: SHORTCUT_SCHEMA_VERSION,
  }));
}

export async function setShortcutOverrideForUser({
  tx,
  userId,
  shortcutId,
  hotkey,
}: {
  tx: Transaction;
  userId: string;
  shortcutId: ShortcutOverride["shortcutId"];
  hotkey: string;
}) {
  const definition = getShortcutDefinition(shortcutId);
  const canonicalHotkey = canonicalizeHotkey(hotkey);
  const existingOverrides = await loadCurrentShortcutOverrides({ tx, userId });
  const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, existingOverrides);

  const conflict = findInternalConflict(shortcutId, canonicalHotkey, resolved);
  if (conflict) {
    return {
      ok: false as const,
      conflict: {
        shortcutId: conflict.id,
        description: conflict.description,
      },
    };
  }

  if (canonicalHotkey === definition.defaultHotkey) {
    await deleteShortcutOverride({
      tx,
      userId,
      shortcutId,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    });

    return {
      ok: true as const,
      override: {
        shortcutId,
        hotkey: definition.defaultHotkey,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
        isCustomized: false,
      },
    };
  }

  const saved = await upsertShortcutOverride({
    tx,
    input: {
      userId,
      shortcutId,
      hotkey: canonicalHotkey,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    },
  });

  if (!saved) {
    throw new Error("Failed to save shortcut override");
  }

  return {
    ok: true as const,
    override: {
      shortcutId: saved.shortcutId as ShortcutOverride["shortcutId"],
      hotkey: saved.hotkey,
      schemaVersion: saved.schemaVersion,
      isCustomized: true,
    },
  };
}

export async function resetShortcutOverrideForUser({
  tx,
  userId,
  shortcutId,
}: {
  tx: Transaction;
  userId: string;
  shortcutId: ShortcutOverride["shortcutId"];
}) {
  await deleteShortcutOverride({
    tx,
    userId,
    shortcutId,
    schemaVersion: SHORTCUT_SCHEMA_VERSION,
  });

  return { success: true as const };
}

export async function resetAllShortcutOverridesForUser({
  tx,
  userId,
}: {
  tx: Transaction;
  userId: string;
}) {
  const deletedCount = await deleteAllShortcutOverrides({
    tx,
    userId,
    schemaVersion: SHORTCUT_SCHEMA_VERSION,
  });

  return { success: true as const, deletedCount };
}
