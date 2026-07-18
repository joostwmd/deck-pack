import { describe, expect, it } from "vitest";

import { SHORTCUT_SCHEMA_VERSION } from "@deck-pack/shortcuts/constants";
import {
  groupOverridesBySchemaVersion,
  migrateShortcutOverridesToCurrent,
  UnsupportedShortcutSchemaVersionError,
} from "@deck-pack/shortcuts/migrations";

describe("migrateShortcutOverridesToCurrent", () => {
  it("returns overrides unchanged for the current version", () => {
    const overrides = [{ shortcutId: "photos" as const, hotkey: "Mod+Alt+P", schemaVersion: 1 }];
    expect(migrateShortcutOverridesToCurrent(SHORTCUT_SCHEMA_VERSION, overrides)).toEqual(
      overrides,
    );
  });

  it("rejects future schema versions", () => {
    expect(() => migrateShortcutOverridesToCurrent(99, [])).toThrow(
      UnsupportedShortcutSchemaVersionError,
    );
  });

  it("migrates v1 balls overrides to harvey-balls", () => {
    const overrides = [{ shortcutId: "balls" as const, hotkey: "Mod+Alt+B", schemaVersion: 1 }];
    expect(migrateShortcutOverridesToCurrent(1, overrides)).toEqual([
      { shortcutId: "harvey-balls", hotkey: "Mod+Alt+B", schemaVersion: 2 },
    ]);
  });
});

describe("groupOverridesBySchemaVersion", () => {
  it("groups rows by schema version", () => {
    const grouped = groupOverridesBySchemaVersion([
      { shortcutId: "photos", hotkey: "Mod+Alt+P", schemaVersion: 1 },
      { shortcutId: "insert", hotkey: "Mod+Shift+Enter", schemaVersion: 2 },
    ]);

    expect(grouped.get(1)).toHaveLength(1);
    expect(grouped.get(2)).toHaveLength(1);
  });
});
