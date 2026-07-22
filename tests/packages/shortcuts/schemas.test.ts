import { describe, expect, it } from "vitest";
import {
  listShortcutsOutputSchema,
  resetShortcutOverrideInputSchema,
  setShortcutOverrideInputSchema,
} from "@deck-pack/shortcuts";

describe("shortcut schemas", () => {
  it("accepts valid set override input", () => {
    const parsed = setShortcutOverrideInputSchema.parse({
      shortcutId: "photos",
      hotkey: "Mod+Alt+P",
    });

    expect(parsed.shortcutId).toBe("photos");
  });

  it("rejects invalid shortcut ids", () => {
    expect(() =>
      setShortcutOverrideInputSchema.parse({
        shortcutId: "unknown",
        hotkey: "Mod+Alt+P",
      }),
    ).toThrow();
  });

  it("rejects modifier-only chords", () => {
    expect(() =>
      setShortcutOverrideInputSchema.parse({
        shortcutId: "photos",
        hotkey: "Mod+Shift",
      }),
    ).toThrow();
  });

  it("parses list output envelope", () => {
    const parsed = listShortcutsOutputSchema.parse({
      schemaVersion: 2,
      overrides: [{ shortcutId: "photos", hotkey: "Mod+Alt+P", schemaVersion: 2 }],
    });

    expect(parsed.overrides).toHaveLength(1);
  });

  it("parses reset input", () => {
    const parsed = resetShortcutOverrideInputSchema.parse({ shortcutId: "photos" });
    expect(parsed.shortcutId).toBe("photos");
  });
});
