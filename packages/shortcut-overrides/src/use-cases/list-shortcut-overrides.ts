import {
  SHORTCUT_SCHEMA_VERSION,
  migrateShortcutOverridesToCurrent,
  type ShortcutOverride,
} from "@deck-pack/shortcuts";

import type { ShortcutOverridesRepository } from "../repositories/shortcut-overrides-repository";

async function loadCurrentShortcutOverrides(
  repo: ShortcutOverridesRepository,
  userId: string,
): Promise<ShortcutOverride[]> {
  const rows = await repo.listAllByUser(userId);

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
    await repo.upsert({
      userId,
      shortcutId: override.shortcutId,
      hotkey: override.hotkey,
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
    });
  }

  return migrated.map((override) => ({
    ...override,
    schemaVersion: SHORTCUT_SCHEMA_VERSION,
  }));
}

export class ListShortcutOverrides {
  constructor(private readonly repo: ShortcutOverridesRepository) {}

  async execute(input: { userId: string }) {
    const overrides = await loadCurrentShortcutOverrides(this.repo, input.userId);
    return {
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
      overrides,
    };
  }
}

export { loadCurrentShortcutOverrides };
