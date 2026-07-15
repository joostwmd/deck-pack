import type { ShortcutDefinition, ShortcutScope } from "./definitions";
import { SHORTCUT_DEFINITIONS } from "./definitions";
import { hotkeysEqual } from "./hotkey";
import type { ShortcutId, ShortcutOverride } from "./schemas";

export interface ResolvedShortcut extends ShortcutDefinition {
  hotkey: string;
  isCustomized: boolean;
}

export function scopesOverlap(
  left: readonly ShortcutScope[],
  right: readonly ShortcutScope[],
): boolean {
  if (left.includes("global") || right.includes("global")) {
    return true;
  }

  return left.some((scope) => right.includes(scope));
}

export function resolveShortcutRegistry(
  definitions: readonly ShortcutDefinition[],
  overrides: readonly ShortcutOverride[],
): ReadonlyMap<ShortcutId, ResolvedShortcut> {
  const overrideById = new Map<ShortcutId, string>();

  for (const override of overrides) {
    const known = definitions.some((definition) => definition.id === override.shortcutId);
    if (!known) continue;
    overrideById.set(override.shortcutId, override.hotkey);
  }

  const resolved = new Map<ShortcutId, ResolvedShortcut>();

  for (const definition of definitions) {
    const overrideHotkey = overrideById.get(definition.id);
    resolved.set(definition.id, {
      ...definition,
      hotkey: overrideHotkey ?? definition.defaultHotkey,
      isCustomized: overrideHotkey !== undefined,
    });
  }

  return resolved;
}

export function resolveDefaultShortcuts(): ReadonlyMap<ShortcutId, ResolvedShortcut> {
  return resolveShortcutRegistry(SHORTCUT_DEFINITIONS, []);
}

export function findInternalConflict(
  candidateId: ShortcutId,
  candidateHotkey: string,
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
): ResolvedShortcut | null {
  const candidate = resolved.get(candidateId);
  if (!candidate) return null;

  for (const shortcut of resolved.values()) {
    if (shortcut.id === candidateId) continue;
    if (!hotkeysEqual(shortcut.hotkey, candidateHotkey)) continue;
    if (!scopesOverlap(candidate.scopes, shortcut.scopes)) continue;
    return shortcut;
  }

  return null;
}

export function getResolvedShortcutsByGroup(
  resolved: ReadonlyMap<ShortcutId, ResolvedShortcut>,
  group: ShortcutDefinition["group"],
): ResolvedShortcut[] {
  return SHORTCUT_DEFINITIONS.filter((definition) => definition.group === group).map(
    (definition) => resolved.get(definition.id)!,
  );
}
