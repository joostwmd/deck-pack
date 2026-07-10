import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import type { Hotkey } from "@tanstack/react-hotkeys";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Primitive types
// ---------------------------------------------------------------------------

export type KeyToken =
  | { type: "text"; value: string }
  | { type: "icon"; icon: LucideIcon; label: string };

export type ShortcutGroup = "tabs" | "search" | "variants" | "actions" | "help";

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
  | "focusSearch"
  | "navigateResultsUp"
  | "navigateResultsDown"
  | "selectResult"
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
const i = (icon: LucideIcon, label: string): KeyToken => ({ type: "icon", icon, label });
const def = (
  id: ShortcutId,
  hotkey: Hotkey,
  keys: KeyToken[],
  description: string,
  group: ShortcutGroup,
  ignoreInputs?: boolean,
): ShortcutDef => ({ id, hotkey, keys, description, group, ignoreInputs });

const UP = i(ArrowBigUp, "↑");
const DOWN = i(ArrowBigDown, "↓");
const LEFT = i(ArrowLeft, "←");
const RIGHT = i(ArrowRight, "→");
const ENTER = i(CornerDownLeft, "↵");
const CMD = t("⌘");
const ESC = t("Esc");

// ---------------------------------------------------------------------------
// All shortcut bindings — single source of truth for UI + hotkey handlers
// ---------------------------------------------------------------------------

export const SHORTCUTS = {
  logos: def("logos", "Mod+L", [CMD, t("L")], "Logos", "tabs"),
  flags: def("flags", "Mod+F", [CMD, t("F")], "Flags", "tabs"),
  icons: def("icons", "Mod+I", [CMD, t("I")], "Icons", "tabs"),
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
  keys: [CMD, UP, DOWN],
  description: "Navigate Search Results",
};

/** Display row for select — matches Figma search-section hints */
export const SELECT_RESULT_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.selectResult,
  keys: [CMD, ENTER],
  description: "Select Result",
};

/** Combined display row for variant navigation — matches Figma results-section hints */
export const NAVIGATE_VARIANTS_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.navigateVariantsLeft,
  keys: [CMD, UP, LEFT, RIGHT, DOWN],
  description: "Navigate Variants",
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

export const ALL_SHORTCUTS: ShortcutDef[] = [
  SHORTCUTS.logos,
  SHORTCUTS.flags,
  SHORTCUTS.icons,
  SHORTCUTS.focusSearch,
  NAVIGATE_RESULTS_DISPLAY,
  SELECT_RESULT_DISPLAY,
  NAVIGATE_VARIANTS_DISPLAY,
  SHORTCUTS.selectVariant,
  SHORTCUTS.insert,
  SHORTCUTS.back,
  SHORTCUTS.openHelp,
];

export const SHORTCUT_GROUPS: { id: ShortcutGroup; label: string }[] = [
  { id: "tabs", label: "Tabs" },
  { id: "search", label: "Search" },
  { id: "variants", label: "Variants" },
  { id: "actions", label: "Actions" },
  { id: "help", label: "Help" },
];

export function getShortcutsByGroup(group: ShortcutGroup): ShortcutDef[] {
  return ALL_SHORTCUTS.filter((shortcut) => shortcut.group === group);
}
