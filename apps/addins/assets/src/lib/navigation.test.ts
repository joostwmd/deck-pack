import { describe, expect, it } from "vitest";

import {
  DEFAULT_NAVIGATION_PAGE_ID,
  NAVIGATION_PAGES,
  NAVIGATION_SECTIONS,
  getNavigationPagesBySection,
} from "./navigation";
import { SHORTCUTS } from "./shortcuts";

describe("navigation registry", () => {
  it("defines assets and utilities sections in order", () => {
    expect(NAVIGATION_SECTIONS.map((section) => section.id)).toEqual(["assets", "utilities"]);
    expect(NAVIGATION_SECTIONS.map((section) => section.label)).toEqual(["Assets", "Utilities"]);
  });

  it("includes every planned page in the assets group", () => {
    const assetIds = getNavigationPagesBySection("assets").map((page) => page.id);

    expect(assetIds).toEqual(["flags", "icons", "logos", "photos", "balls", "slides"]);
  });

  it("includes every planned page in the utilities group", () => {
    const utilityIds = getNavigationPagesBySection("utilities").map((page) => page.id);

    expect(utilityIds).toEqual(["agenda", "check", "format", "themes"]);
  });

  it("uses unique paths and shortcut ids", () => {
    const paths = NAVIGATION_PAGES.map((page) => page.path);
    const shortcutIds = NAVIGATION_PAGES.map((page) => page.shortcut.id);

    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(shortcutIds).size).toBe(shortcutIds.length);
  });

  it("uses Mod+Shift navigation shortcuts for every page", () => {
    for (const page of NAVIGATION_PAGES) {
      expect(page.shortcut.hotkey).toMatch(/^Mod\+Shift\+/);
    }
  });

  it("defaults to logos", () => {
    expect(DEFAULT_NAVIGATION_PAGE_ID).toBe("logos");
    expect(SHORTCUTS.logos.id).toBe("logos");
  });
});
