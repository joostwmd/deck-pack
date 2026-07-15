import { useMemo } from "react";

import {
  getInsertSectionShortcutDefs,
  getSearchNavigationShortcutDefs,
  getVariantNavigationShortcutDefs,
  resolvedShortcutToDef,
  type ShortcutId,
} from "@/lib/shortcuts";
import { useShortcutBindings } from "@/providers/shortcut-bindings-provider";

export function useResolvedShortcutDef(id: ShortcutId) {
  const { getShortcut } = useShortcutBindings();
  return useMemo(() => resolvedShortcutToDef(getShortcut(id)), [getShortcut, id]);
}

export function useSearchNavigationShortcutDefs() {
  const { shortcuts } = useShortcutBindings();
  return useMemo(() => getSearchNavigationShortcutDefs(shortcuts), [shortcuts]);
}

export function useVariantNavigationShortcutDefs() {
  const { shortcuts } = useShortcutBindings();
  return useMemo(() => getVariantNavigationShortcutDefs(shortcuts), [shortcuts]);
}

export function useInsertSectionShortcutDefs() {
  const { shortcuts } = useShortcutBindings();
  return useMemo(() => getInsertSectionShortcutDefs(shortcuts), [shortcuts]);
}
