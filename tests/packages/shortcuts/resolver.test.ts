import { describe, expect, it } from "vitest";

import { SHORTCUT_DEFINITIONS } from "@deck-pack/shortcuts/definitions";
import {
  findInternalConflict,
  resolveShortcutRegistry,
  scopesOverlap,
} from "@deck-pack/shortcuts/resolver";
import type { ShortcutOverride } from "@deck-pack/shortcuts/schemas";

describe("scopesOverlap", () => {
  it("treats global as overlapping every scope", () => {
    expect(scopesOverlap(["global"], ["search-results"])).toBe(true);
    expect(scopesOverlap(["variant-picker"], ["global"])).toBe(true);
  });

  it("allows disjoint non-global scopes", () => {
    expect(scopesOverlap(["search-results"], ["variant-picker"])).toBe(false);
  });
});

describe("resolveShortcutRegistry", () => {
  it("uses defaults when overrides are empty", () => {
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, []);
    expect(resolved.get("photos")?.hotkey).toBe("Mod+Shift+P");
    expect(resolved.get("photos")?.isCustomized).toBe(false);
  });

  it("applies partial overrides", () => {
    const overrides: ShortcutOverride[] = [
      { shortcutId: "photos", hotkey: "Mod+Alt+P", schemaVersion: 1 },
    ];
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, overrides);
    expect(resolved.get("photos")?.hotkey).toBe("Mod+Alt+P");
    expect(resolved.get("photos")?.isCustomized).toBe(true);
    expect(resolved.get("logos")?.hotkey).toBe("Mod+Shift+L");
  });

  it("ignores unknown shortcut ids", () => {
    const overrides = [
      {
        shortcutId: "unknown" as ShortcutOverride["shortcutId"],
        hotkey: "Mod+X",
        schemaVersion: 1,
      },
    ];
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, overrides);
    expect(resolved.size).toBe(SHORTCUT_DEFINITIONS.length);
  });
});

describe("findInternalConflict", () => {
  it("blocks overlapping scopes with the same chord", () => {
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, [
      { shortcutId: "photos", hotkey: "Mod+Shift+L", schemaVersion: 1 },
    ]);

    const conflict = findInternalConflict("logos", "Mod+Shift+L", resolved);
    expect(conflict?.id).toBe("photos");
  });

  it("allows duplicate chords in disjoint scopes", () => {
    const resolved = resolveShortcutRegistry(SHORTCUT_DEFINITIONS, []);
    const conflict = findInternalConflict(
      "navigateResultsUp",
      "ArrowUp",
      resolved,
    );
    expect(conflict).toBeNull();
  });
});
