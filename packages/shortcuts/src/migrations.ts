import { SHORTCUT_SCHEMA_VERSION } from "./constants";
import type { ShortcutOverride } from "./schemas";

export class UnsupportedShortcutSchemaVersionError extends Error {
  readonly version: number;

  constructor(version: number) {
    super(`Unsupported shortcut schema version: ${version}`);
    this.name = "UnsupportedShortcutSchemaVersionError";
    this.version = version;
  }
}

export type ShortcutMigration = (
  overrides: readonly ShortcutOverride[],
) => readonly ShortcutOverride[];

const migrations: ShortcutMigration[] = [];

export function migrateShortcutOverridesToCurrent(
  sourceVersion: number,
  overrides: readonly ShortcutOverride[],
): readonly ShortcutOverride[] {
  if (sourceVersion === SHORTCUT_SCHEMA_VERSION) {
    return overrides;
  }

  if (sourceVersion > SHORTCUT_SCHEMA_VERSION) {
    throw new UnsupportedShortcutSchemaVersionError(sourceVersion);
  }

  let current = overrides;
  let version = sourceVersion;

  while (version < SHORTCUT_SCHEMA_VERSION) {
    const migration = migrations[version - 1];
    if (!migration) {
      throw new UnsupportedShortcutSchemaVersionError(sourceVersion);
    }
    current = migration(current);
    version += 1;
  }

  return current;
}

export function groupOverridesBySchemaVersion(
  overrides: readonly ShortcutOverride[],
): Map<number, ShortcutOverride[]> {
  const grouped = new Map<number, ShortcutOverride[]>();

  for (const override of overrides) {
    const bucket = grouped.get(override.schemaVersion) ?? [];
    bucket.push(override);
    grouped.set(override.schemaVersion, bucket);
  }

  return grouped;
}
