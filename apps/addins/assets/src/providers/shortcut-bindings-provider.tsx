import {
  findInternalConflict,
  resolveShortcutRegistry,
  SHORTCUT_DEFINITIONS,
  type ResolvedShortcut,
  type ShortcutId,
  type ShortcutOverride,
} from "@deck-pack/shortcuts";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";
import { useServices } from "@/services/services-context";

interface ShortcutBindingsContextValue {
  shortcuts: ReadonlyMap<ShortcutId, ResolvedShortcut>;
  loading: boolean;
  loadError: string | null;
  isCapturing: boolean;
  getShortcut: (id: ShortcutId) => ResolvedShortcut;
  setCapturing: (value: boolean) => void;
  saveOverride: (id: ShortcutId, hotkey: string) => Promise<void>;
  resetOverride: (id: ShortcutId) => Promise<void>;
  resetAll: () => Promise<void>;
  retry: () => Promise<void>;
  findLocalConflict: (id: ShortcutId, hotkey: string) => ResolvedShortcut | null;
}

const ShortcutBindingsContext = createContext<ShortcutBindingsContextValue | null>(null);

export function ShortcutBindingsProvider({ children }: { children: ReactNode }) {
  const { shortcutStore } = useServices();
  const [overrides, setOverrides] = useState<ShortcutOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCapturing, setCapturing] = useState(false);

  const shortcuts = useMemo(
    () => resolveShortcutRegistry(SHORTCUT_DEFINITIONS, overrides),
    [overrides],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await shortcutStore.list();
      setOverrides(result.overrides);
    } catch (error) {
      setOverrides([]);
      setLoadError(getUserFacingApiErrorMessage(error, "Custom shortcuts couldn't be loaded"));
    } finally {
      setLoading(false);
    }
  }, [shortcutStore]);

  const getShortcut = useCallback(
    (id: ShortcutId) => {
      const shortcut = shortcuts.get(id);
      if (!shortcut) {
        throw new Error(`Unknown shortcut: ${id}`);
      }
      return shortcut;
    },
    [shortcuts],
  );

  const saveOverride = useCallback(
    async (id: ShortcutId, hotkey: string) => {
      const saved = await shortcutStore.setOverride({
        shortcutId: id,
        hotkey,
      });

      setOverrides((current) => {
        const next = current.filter((override) => override.shortcutId !== id);
        if (saved.isCustomized) {
          next.push({
            shortcutId: saved.shortcutId,
            hotkey: saved.hotkey,
            schemaVersion: saved.schemaVersion,
          });
        }
        return next;
      });
    },
    [shortcutStore],
  );

  const resetOverride = useCallback(
    async (id: ShortcutId) => {
      await shortcutStore.resetOverride({ shortcutId: id });
      setOverrides((current) => current.filter((override) => override.shortcutId !== id));
    },
    [shortcutStore],
  );

  const resetAll = useCallback(async () => {
    await shortcutStore.resetAll();
    setOverrides([]);
  }, [shortcutStore]);

  const findLocalConflict = useCallback(
    (id: ShortcutId, hotkey: string) => findInternalConflict(id, hotkey, shortcuts),
    [shortcuts],
  );

  const value = useMemo<ShortcutBindingsContextValue>(
    () => ({
      shortcuts,
      loading,
      loadError,
      isCapturing,
      getShortcut,
      setCapturing,
      saveOverride,
      resetOverride,
      resetAll,
      retry: refresh,
      findLocalConflict,
    }),
    [
      shortcuts,
      loading,
      loadError,
      isCapturing,
      getShortcut,
      saveOverride,
      resetOverride,
      resetAll,
      refresh,
      findLocalConflict,
    ],
  );

  return (
    <ShortcutBindingsContext.Provider value={value}>
      <ShortcutBindingsLoader onLoad={refresh} />
      {children}
    </ShortcutBindingsContext.Provider>
  );
}

function ShortcutBindingsLoader({ onLoad }: { onLoad: () => Promise<void> }) {
  useEffect(() => {
    void onLoad();
  }, [onLoad]);

  return null;
}

export function useShortcutBindings(): ShortcutBindingsContextValue {
  const context = useContext(ShortcutBindingsContext);
  if (!context) {
    throw new Error("useShortcutBindings must be used within ShortcutBindingsProvider");
  }
  return context;
}
