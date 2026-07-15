import { describe, expect, it } from "vitest";

import { canonicalizeHotkey, hotkeysEqual, InvalidHotkeyError } from "./hotkey";

describe("canonicalizeHotkey", () => {
  it("normalizes modifier aliases and order", () => {
    expect(canonicalizeHotkey("shift+cmd+l")).toBe("Mod+Shift+L");
    expect(canonicalizeHotkey("Meta+Shift+L")).toBe("Mod+Shift+L");
    expect(canonicalizeHotkey("Mod+Shift+L")).toBe("Mod+Shift+L");
  });

  it("normalizes navigation and function keys", () => {
    expect(canonicalizeHotkey("arrowup")).toBe("ArrowUp");
    expect(canonicalizeHotkey("esc")).toBe("Escape");
    expect(canonicalizeHotkey("enter")).toBe("Enter");
    expect(canonicalizeHotkey("f5")).toBe("F5");
  });

  it("preserves punctuation shortcuts", () => {
    expect(canonicalizeHotkey("Mod+/")).toBe("Mod+/");
  });

  it("rejects modifier-only chords", () => {
    expect(() => canonicalizeHotkey("Shift+Mod")).toThrow(InvalidHotkeyError);
  });

  it("rejects multiple non-modifier keys", () => {
    expect(() => canonicalizeHotkey("A+B")).toThrow(InvalidHotkeyError);
  });
});

describe("hotkeysEqual", () => {
  it("compares canonical equivalents", () => {
    expect(hotkeysEqual("shift+cmd+l", "Mod+Shift+L")).toBe(true);
    expect(hotkeysEqual("Mod+Shift+L", "Mod+Shift+F")).toBe(false);
  });
});
