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
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk } from "../../api/resilience/service-result";

import type { deleteAllShortcutOverrides } from "@deck-pack/db/queries/deleteAllShortcutOverrides";
import type { deleteShortcutOverride } from "@deck-pack/db/queries/deleteShortcutOverride";
import type { listAllShortcutOverridesByUser } from "@deck-pack/db/queries/listShortcutOverridesByUser";
import type { upsertShortcutOverride } from "@deck-pack/db/queries/upsertShortcutOverride";

export type ShortcutServiceDeps = {
  listAllShortcutOverridesByUser: typeof listAllShortcutOverridesByUser;
  upsertShortcutOverride: typeof upsertShortcutOverride;
  deleteShortcutOverride: typeof deleteShortcutOverride;
  deleteAllShortcutOverrides: typeof deleteAllShortcutOverrides;
};

export function createShortcutService(deps: ShortcutServiceDeps) {
  async function loadCurrentShortcutOverrides(
    tx: Transaction,
    userId: string,
  ): Promise<ShortcutOverride[]> {
    const rows = await deps.listAllShortcutOverridesByUser({ tx, userId });

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
      await deps.upsertShortcutOverride({
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

  return {
    list: async (tx: Transaction, input: { userId: string }) => {
      const overrides = await loadCurrentShortcutOverrides(tx, input.userId);
      return serviceOk({
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
        overrides,
      });
    },

    setOverride: async (
      tx: Transaction,
      input: {
        userId: string;
        shortcutId: ShortcutOverride["shortcutId"];
        hotkey: string;
      },
    ) => {
      const definition = getShortcutDefinition(input.shortcutId);
      const canonicalHotkey = canonicalizeHotkey(input.hotkey);
      const existingOverrides = await loadCurrentShortcutOverrides(tx, input.userId);
      const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, existingOverrides);

      const conflict = findInternalConflict(input.shortcutId, canonicalHotkey, resolved);
      if (conflict) {
        return serviceFail("conflict", {
          message: `Shortcut already assigned to "${conflict.description}"`,
          details: {
            shortcutId: conflict.id,
            description: conflict.description,
          },
        });
      }

      if (canonicalHotkey === definition.defaultHotkey) {
        await deps.deleteShortcutOverride({
          tx,
          userId: input.userId,
          shortcutId: input.shortcutId,
          schemaVersion: SHORTCUT_SCHEMA_VERSION,
        });

        return serviceOk({
          shortcutId: input.shortcutId,
          hotkey: definition.defaultHotkey,
          schemaVersion: SHORTCUT_SCHEMA_VERSION,
          isCustomized: false,
        });
      }

      const saved = await deps.upsertShortcutOverride({
        tx,
        input: {
          userId: input.userId,
          shortcutId: input.shortcutId,
          hotkey: canonicalHotkey,
          schemaVersion: SHORTCUT_SCHEMA_VERSION,
        },
      });

      if (!saved) {
        return serviceFail("internal", { message: "Failed to save shortcut override" });
      }

      return serviceOk({
        shortcutId: saved.shortcutId as ShortcutOverride["shortcutId"],
        hotkey: saved.hotkey,
        schemaVersion: saved.schemaVersion,
        isCustomized: true,
      });
    },

    resetOverride: async (
      tx: Transaction,
      input: { userId: string; shortcutId: ShortcutOverride["shortcutId"] },
    ) => {
      await deps.deleteShortcutOverride({
        tx,
        userId: input.userId,
        shortcutId: input.shortcutId,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
      });

      return serviceOk({ success: true as const });
    },

    resetAll: async (tx: Transaction, input: { userId: string }) => {
      const deletedCount = await deps.deleteAllShortcutOverrides({
        tx,
        userId: input.userId,
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
      });

      return serviceOk({ success: true as const, deletedCount });
    },
  };
}

export type ShortcutService = ReturnType<typeof createShortcutService>;
