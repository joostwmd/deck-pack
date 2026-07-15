import type { ShortcutId } from "./schemas";

export type ShortcutScope =
  | "global"
  | "search-results"
  | "variant-picker"
  | "asset-grid"
  | "asset-action";

export type ShortcutGroup = "navigation" | "search" | "variants" | "actions" | "help";

export interface ShortcutDefinition {
  id: ShortcutId;
  defaultHotkey: string;
  description: string;
  group: ShortcutGroup;
  scopes: readonly ShortcutScope[];
  ignoreInputs: boolean;
  customizable: boolean;
}

const nav = (id: ShortcutId, defaultHotkey: string, description: string): ShortcutDefinition => ({
  id,
  defaultHotkey,
  description,
  group: "navigation",
  scopes: ["global"],
  ignoreInputs: true,
  customizable: true,
});

export const SHORTCUT_DEFINITIONS: readonly ShortcutDefinition[] = [
  nav("logos", "Mod+Shift+L", "Logos"),
  nav("flags", "Mod+Shift+F", "Flags"),
  nav("icons", "Mod+Shift+I", "Icons"),
  nav("photos", "Mod+Shift+P", "Photos"),
  nav("balls", "Mod+Shift+B", "Balls"),
  nav("slides", "Mod+Shift+S", "Slides"),
  nav("shapes", "Mod+Shift+H", "Shapes"),
  nav("agenda", "Mod+Shift+A", "Agenda"),
  nav("check", "Mod+Shift+C", "Check"),
  nav("format", "Mod+Shift+O", "Format"),
  nav("themes", "Mod+Shift+T", "Themes"),
  {
    id: "openMenu",
    defaultHotkey: "Mod+Shift+M",
    description: "Open navigation menu",
    group: "navigation",
    scopes: ["global"],
    ignoreInputs: true,
    customizable: true,
  },
  {
    id: "focusSearch",
    defaultHotkey: "Mod+K",
    description: "Focus search",
    group: "search",
    scopes: ["global", "asset-grid"],
    ignoreInputs: true,
    customizable: true,
  },
  {
    id: "navigateResultsUp",
    defaultHotkey: "ArrowUp",
    description: "Navigate results up",
    group: "search",
    scopes: ["search-results"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "navigateResultsDown",
    defaultHotkey: "ArrowDown",
    description: "Navigate results down",
    group: "search",
    scopes: ["search-results"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "selectResult",
    defaultHotkey: "Enter",
    description: "Select result",
    group: "search",
    scopes: ["search-results"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "navigateVariantsUp",
    defaultHotkey: "ArrowUp",
    description: "Navigate variants up",
    group: "variants",
    scopes: ["variant-picker", "asset-grid"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "navigateVariantsDown",
    defaultHotkey: "ArrowDown",
    description: "Navigate variants down",
    group: "variants",
    scopes: ["variant-picker", "asset-grid"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "navigateVariantsLeft",
    defaultHotkey: "ArrowLeft",
    description: "Navigate variants left",
    group: "variants",
    scopes: ["variant-picker", "asset-grid"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "navigateVariantsRight",
    defaultHotkey: "ArrowRight",
    description: "Navigate variants right",
    group: "variants",
    scopes: ["variant-picker", "asset-grid"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "selectVariant",
    defaultHotkey: "Enter",
    description: "Confirm variant",
    group: "variants",
    scopes: ["variant-picker", "asset-grid"],
    ignoreInputs: false,
    customizable: true,
  },
  {
    id: "insert",
    defaultHotkey: "Mod+Enter",
    description: "Insert",
    group: "actions",
    scopes: ["asset-action", "variant-picker", "asset-grid"],
    ignoreInputs: true,
    customizable: true,
  },
  {
    id: "back",
    defaultHotkey: "Escape",
    description: "Back / clear",
    group: "actions",
    scopes: ["asset-action", "search-results", "variant-picker", "asset-grid"],
    ignoreInputs: true,
    customizable: true,
  },
  {
    id: "openShortcuts",
    defaultHotkey: "Mod+/",
    description: "Open shortcut settings",
    group: "help",
    scopes: ["global"],
    ignoreInputs: true,
    customizable: true,
  },
] as const;

export const SHORTCUT_DEFINITION_MAP = new Map(
  SHORTCUT_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getShortcutDefinition(id: ShortcutId): ShortcutDefinition {
  const definition = SHORTCUT_DEFINITION_MAP.get(id);
  if (!definition) {
    throw new Error(`Unknown shortcut id: ${id}`);
  }
  return definition;
}

export const SHORTCUT_GROUPS: { id: ShortcutGroup; label: string }[] = [
  { id: "navigation", label: "Navigation" },
  { id: "search", label: "Search" },
  { id: "variants", label: "Variants" },
  { id: "actions", label: "Actions" },
  { id: "help", label: "Help" },
];
