import { describe, expect, it } from "vitest";

import {
  DEFAULT_NAVIGATION_PAGE_ID,
  NAVIGATION_SECTIONS,
  getNavigationPagesBySection,
  getNavigationPagesWithShortcuts,
} from "@/constants/navigation";
import { SHORTCUTS } from "@/lib/shortcuts";

describe("navigation registry", () => {
  it("defines assets, utilities, and settings sections in order", () => {
    expect(NAVIGATION_SECTIONS.map((section) => section.id)).toEqual([
      "assets",
      "utilities",
      "settings",
    ]);
    expect(NAVIGATION_SECTIONS.map((section) => section.label)).toEqual([
      "Assets",
      "Utilities",
      "Settings",
    ]);
  });

  it("includes every planned page in the assets group", () => {
    const assetIds = getNavigationPagesBySection("assets").map((page) => page.id);

    expect(assetIds).toEqual([
      "flags",
      "icons",
      "logos",
      "photos",
      "harvey-balls",
      "slides",
      "shapes",
    ]);
  });

  it("includes every planned page in the utilities group", () => {
    const utilityIds = getNavigationPagesBySection("utilities").map((page) => page.id);

    expect(utilityIds).toEqual(["agenda", "check", "format", "themes"]);
  });

  it("includes settings pages without shortcuts", () => {
    const settingsPages = getNavigationPagesBySection("settings");

    expect(settingsPages.map((page) => page.id)).toEqual(["account", "shortcuts"]);
    expect(settingsPages.every((page) => page.shortcut === undefined)).toBe(true);
  });

  it("uses unique paths and shortcut ids for shortcut-backed pages", () => {
    const shortcutPages = getNavigationPagesWithShortcuts();
    const paths = shortcutPages.map((page) => page.path);
    const shortcutIds = shortcutPages.map((page) => page.shortcut!.id);

    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(shortcutIds).size).toBe(shortcutIds.length);
  });

  it("uses Mod+Shift navigation shortcuts for shortcut-backed pages", () => {
    for (const page of getNavigationPagesWithShortcuts()) {
      expect(page.shortcut!.hotkey).toMatch(/^Mod\+Shift\+/);
    }
  });

  it("defaults to logos", () => {
    expect(DEFAULT_NAVIGATION_PAGE_ID).toBe("logos");
    expect(SHORTCUTS.logos.id).toBe("logos");
  });
});
