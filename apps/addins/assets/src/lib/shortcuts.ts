import {
  SHORTCUT_DEFINITIONS,
  SHORTCUT_GROUPS,
  getResolvedShortcutsByGroup,
  resolveDefaultShortcuts,
  type ResolvedShortcut,
  type ShortcutGroup,
  type ShortcutId,
} from "@deck-pack/shortcuts";
import type { Hotkey } from "@tanstack/react-hotkeys";

import { hotkeyToKeyTokens as mapHotkeyToKeyTokens } from "@/lib/hotkey-display";

export type { ShortcutId, ShortcutGroup };
export { SHORTCUT_GROUPS };

export type KeyToken = {
  type: "text";
  value: string;
};

export interface ShortcutDef {
  id: ShortcutId;
  hotkey: Hotkey;
  keys: KeyToken[];
  description: string;
  group: ShortcutGroup;
  ignoreInputs?: boolean;
  isCustomized?: boolean;
}

const UP = mapHotkeyToKeyTokens("ArrowUp")[0]!;
const DOWN = mapHotkeyToKeyTokens("ArrowDown")[0]!;
const LEFT = mapHotkeyToKeyTokens("ArrowLeft")[0]!;
const RIGHT = mapHotkeyToKeyTokens("ArrowRight")[0]!;
const ENTER = mapHotkeyToKeyTokens("Enter")[0]!;

function resolvedToDef(shortcut: ResolvedShortcut): ShortcutDef {
  return {
    id: shortcut.id,
    hotkey: shortcut.hotkey as Hotkey,
    keys: hotkeyToKeyTokens(shortcut.hotkey),
    description: shortcut.description,
    group: shortcut.group,
    ignoreInputs: shortcut.ignoreInputs,
    isCustomized: shortcut.isCustomized,
  };
}

function hotkeyToKeyTokens(hotkey: string): KeyToken[] {
  return mapHotkeyToKeyTokens(hotkey);
}

const defaultResolved = resolveDefaultShortcuts();

export const SHORTCUTS = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map((definition) => {
    const resolved = defaultResolved.get(definition.id)!;
    return [definition.id, resolvedToDef(resolved)];
  }),
) as Record<ShortcutId, ShortcutDef>;

export function resolvedShortcutToDef(shortcut: ResolvedShortcut): ShortcutDef {
  return resolvedToDef(shortcut);
}

export function getShortcutDefsByGroup(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
  group: ShortcutGroup,
): ShortcutDef[] {
  return getResolvedShortcutsByGroup(resolved, group).map(resolvedShortcutToDef);
}

export const NAVIGATE_RESULTS_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.navigateResultsUp,
  keys: [UP, DOWN],
  description: "Navigate results",
};

export const SELECT_RESULT_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.selectResult,
  keys: [ENTER],
  description: "Select result",
};

export const NAVIGATE_VARIANTS_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.navigateVariantsLeft,
  keys: [UP, DOWN, LEFT, RIGHT],
  description: "Navigate variants",
};

export function getDisplayShortcutDefs(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
): ShortcutDef[] {
  const get = (id: ShortcutId) => resolvedShortcutToDef(resolved.get(id)!);

  return [
    get("openMenu"),
    get("logos"),
    get("flags"),
    get("icons"),
    get("photos"),
    get("harvey-balls"),
    get("slides"),
    get("shapes"),
    get("agenda"),
    get("check"),
    get("format"),
    get("themes"),
    get("focusSearch"),
    {
      ...get("navigateResultsUp"),
      keys: [UP, DOWN],
      description: "Navigate results",
    },
    get("selectResult"),
    {
      ...get("navigateVariantsLeft"),
      keys: [UP, DOWN, LEFT, RIGHT],
      description: "Navigate variants",
    },
    get("selectVariant"),
    {
      ...get("insert"),
      description: "Insert Selected Variant",
    },
    get("back"),
    get("openShortcuts"),
  ];
}

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

export const INSERT_SECTION_DISPLAY: ShortcutDef = {
  ...SHORTCUTS.insert,
  description: "Insert Selected Variant",
};

export const INSERT_SECTION_SHORTCUTS: ShortcutDef[] = [INSERT_SECTION_DISPLAY];

export const ALL_SHORTCUTS: ShortcutDef[] = getDisplayShortcutDefs(defaultResolved);

export function getShortcutsByGroup(group: ShortcutGroup): ShortcutDef[] {
  return ALL_SHORTCUTS.filter((shortcut) => shortcut.group === group);
}

export function getResolvedDisplayShortcutsByGroup(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
  group: ShortcutGroup,
): ShortcutDef[] {
  return getDisplayShortcutDefs(resolved).filter((shortcut) => shortcut.group === group);
}

export function getSearchNavigationShortcutDefs(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
): ShortcutDef[] {
  const get = (id: ShortcutId) => resolvedShortcutToDef(resolved.get(id)!);

  return [
    {
      ...get("navigateResultsUp"),
      keys: [
        ...hotkeyToKeyTokens(get("navigateResultsUp").hotkey),
        ...hotkeyToKeyTokens(get("navigateResultsDown").hotkey),
      ],
      description: "Navigate results",
    },
    get("selectResult"),
  ];
}

export function getVariantNavigationShortcutDefs(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
): ShortcutDef[] {
  const get = (id: ShortcutId) => resolvedShortcutToDef(resolved.get(id)!);

  return [
    {
      ...get("navigateVariantsLeft"),
      keys: [
        ...hotkeyToKeyTokens(get("navigateVariantsUp").hotkey),
        ...hotkeyToKeyTokens(get("navigateVariantsDown").hotkey),
        ...hotkeyToKeyTokens(get("navigateVariantsLeft").hotkey),
        ...hotkeyToKeyTokens(get("navigateVariantsRight").hotkey),
      ],
      description: "Navigate variants",
    },
  ];
}

export function getInsertSectionShortcutDefs(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
): ShortcutDef[] {
  return [
    {
      ...resolvedShortcutToDef(resolved.get("insert")!),
      description: "Insert Selected Variant",
    },
  ];
}
