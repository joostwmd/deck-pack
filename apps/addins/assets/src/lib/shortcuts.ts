import {
  ArrowBendDownLeft,
  ArrowFatDown,
  ArrowFatUp,
  ArrowLeft,
  ArrowRight,
  type Icon,
} from "@phosphor-icons/react";
import type { Hotkey } from "@tanstack/react-hotkeys";

// ---------------------------------------------------------------------------
// Primitive types
// ---------------------------------------------------------------------------

export type KeyToken =
  | { type: "text"; value: string }
  | { type: "icon"; icon: Icon; label: string };

export type ShortcutGroup = "navigation" | "search" | "variants" | "actions" | "help";

export interface ShortcutDef {
  id: ShortcutId;
  hotkey: Hotkey;
  keys: KeyToken[];
  description: string;
  group: ShortcutGroup;
  /** When true, shortcut is blocked while typing in text inputs (TanStack default). */
  ignoreInputs?: boolean;
}

export type ShortcutId =
  | "logos"
  | "flags"
  | "icons"
  | "photos"
  | "balls"
  | "slides"
  | "shapes"
  | "agenda"
  | "check"
  | "format"
  | "themes"
  | "openMenu"
  | "focusSearch"
  | "navigateResultsUp"
  | "navigateResultsDown"
  | "selectResult"
  | "navigateVariantsUp"
  | "navigateVariantsDown"
  | "navigateVariantsLeft"
  | "navigateVariantsRight"
  | "selectVariant"
  | "insert"
  | "back"
  | "openHelp";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const t = (value: string): KeyToken => ({ type: "text", value });
const i = (icon: Icon, label: string): KeyToken => ({ type: "icon", icon, label });
const def = (
  id: ShortcutId,
  hotkey: Hotkey,
  keys: KeyToken[],
  description: string,
  group: ShortcutGroup,
  ignoreInputs?: boolean,
): ShortcutDef => ({ id, hotkey, keys, description, group, ignoreInputs });

const UP = i(ArrowFatUp, "↑");
const DOWN = i(ArrowFatDown, "↓");
const LEFT = i(ArrowLeft, "←");
const RIGHT = i(ArrowRight, "→");
const ENTER = i(ArrowBendDownLeft, "↵");
const CMD = t("⌘");
const SHIFT = t("⇧");
const ESC = t("Esc");

// ---------------------------------------------------------------------------
// All shortcut bindings — single source of truth for UI + hotkey handlers
// ---------------------------------------------------------------------------

export const SHORTCUTS = {
  logos: def("logos", "Mod+Shift+L", [CMD, SHIFT, t("L")], "Logos", "navigation"),
  flags: def("flags", "Mod+Shift+F", [CMD, SHIFT, t("F")], "Flags", "navigation"),
  icons: def("icons", "Mod+Shift+I", [CMD, SHIFT, t("I")], "Icons", "navigation"),
  photos: def("photos", "Mod+Shift+P", [CMD, SHIFT, t("P")], "Photos", "navigation"),
  balls: def("balls", "Mod+Shift+B", [CMD, SHIFT, t("B")], "Balls", "navigation"),
  slides: def("slides", "Mod+Shift+S", [CMD, SHIFT, t("S")], "Slides", "navigation"),
  shapes: def("shapes", "Mod+Shift+H", [CMD, SHIFT, t("H")], "Shapes", "navigation"),
  agenda: def("agenda", "Mod+Shift+A", [CMD, SHIFT, t("A")], "Agenda", "navigation"),
  check: def("check", "Mod+Shift+C", [CMD, SHIFT, t("C")], "Check", "navigation"),
  format: def("format", "Mod+Shift+O", [CMD, SHIFT, t("O")], "Format", "navigation"),
  themes: def("themes", "Mod+Shift+T", [CMD, SHIFT, t("T")], "Themes", "navigation"),
  openMenu: def("openMenu", "Mod+Shift+M", [CMD, SHIFT, t("M")], "Open navigation menu", "navigation"),
  focusSearch: def("focusSearch", "Mod+K", [CMD, t("K")], "Focus search", "search"),
  navigateResultsUp: def(
    "navigateResultsUp",
    "ArrowUp",
    [UP],
    "Navigate results up",
    "search",
    false,
  ),
  navigateResultsDown: def(
    "navigateResultsDown",
    "ArrowDown",
    [DOWN],
    "Navigate results down",
    "search",
    false,
  ),
  selectResult: def("selectResult", "Enter", [ENTER], "Select result", "search", false),
  navigateVariantsUp: def(
    "navigateVariantsUp",
    "ArrowUp",
    [UP],
    "Navigate variants up",
    "variants",
    false,
  ),
  navigateVariantsDown: def(
    "navigateVariantsDown",
    "ArrowDown",
    [DOWN],
    "Navigate variants down",
    "variants",
    false,
  ),
  navigateVariantsLeft: def(
    "navigateVariantsLeft",
    "ArrowLeft",
    [LEFT],
    "Navigate variants left",
    "variants",
    false,
  ),
  navigateVariantsRight: def(
    "navigateVariantsRight",
    "ArrowRight",
    [RIGHT],
    "Navigate variants right",
    "variants",
    false,
  ),
  selectVariant: def("selectVariant", "Enter", [ENTER], "Confirm variant", "variants", false),
  insert: def("insert", "Mod+Enter", [CMD, ENTER], "Insert", "actions"),
  back: def("back", "Escape", [ESC], "Back / clear", "actions"),
  openHelp: def("openHelp", "Mod+/", [CMD, t("/")], "Keyboard shortcuts", "help"),
} as const satisfies Record<string, ShortcutDef>;

// ---------------------------------------------------------------------------
// Grouped sets used in the panel UI
// ---------------------------------------------------------------------------

/** Combined display row for up/down navigation — matches Figma search-section hints */
export const NAVIGATE_RESULTS_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.navigateResultsUp,
  keys: [UP, DOWN],
  description: "Navigate results",
};

/** Display row for select — matches Figma search-section hints */
export const SELECT_RESULT_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.selectResult,
  keys: [ENTER],
  description: "Select result",
};

/** Combined display row for variant navigation */
export const NAVIGATE_VARIANTS_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.navigateVariantsLeft,
  keys: [UP, DOWN, LEFT, RIGHT],
  description: "Navigate variants",
};

export const VARIANT_NAVIGATION_SHORTCUTS: ShortcutDef[] = [NAVIGATE_VARIANTS_DISPLAY];

export const SEARCH_NAVIGATION_SHORTCUTS: ShortcutDef[] = [
  NAVIGATE_RESULTS_DISPLAY,
  SELECT_RESULT_DISPLAY,
];

export const SEARCH_SHORTCUTS: ShortcutDef[] = [
  SHORTCUTS.focusSearch,
  ...SEARCH_NAVIGATION_SHORTCUTS,
];

export const VARIANT_SHORTCUTS: ShortcutDef[] = [
  NAVIGATE_VARIANTS_DISPLAY,
  SHORTCUTS.selectVariant,
];

export const INSERT_SHORTCUT: ShortcutDef = SHORTCUTS.insert;

/** Display row for insert section */
export const INSERT_SECTION_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.insert,
  description: "Insert Selected Variant",
};

export const INSERT_SECTION_SHORTCUTS: ShortcutDef[] = [INSERT_SECTION_DISPLAY];

export const ALL_SHORTCUTS: ShortcutDef[] = [
  SHORTCUTS.openMenu,
  SHORTCUTS.logos,
  SHORTCUTS.flags,
  SHORTCUTS.icons,
  SHORTCUTS.photos,
  SHORTCUTS.balls,
  SHORTCUTS.slides,
  SHORTCUTS.shapes,
  SHORTCUTS.agenda,
  SHORTCUTS.check,
  SHORTCUTS.format,
  SHORTCUTS.themes,
  SHORTCUTS.focusSearch,
  NAVIGATE_RESULTS_DISPLAY,
  SELECT_RESULT_DISPLAY,
  NAVIGATE_VARIANTS_DISPLAY,
  SHORTCUTS.selectVariant,
  INSERT_SECTION_DISPLAY,
  SHORTCUTS.back,
  SHORTCUTS.openHelp,
];

export const SHORTCUT_GROUPS: { id: ShortcutGroup; label: string }[] = [
  { id: "navigation", label: "Navigation" },
  { id: "search", label: "Search" },
  { id: "variants", label: "Variants" },
  { id: "actions", label: "Actions" },
  { id: "help", label: "Help" },
];

export function getShortcutsByGroup(group: ShortcutGroup): ShortcutDef[] {
  return ALL_SHORTCUTS.filter((shortcut) => shortcut.group === group);
}
