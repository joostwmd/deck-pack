import type { ShortcutId, ShortcutOverride } from "@deck-pack/shortcuts";

export type ShortcutOverrideRecord = {
  shortcutId: ShortcutId;
  hotkey: string;
  isCustomized: boolean;
  schemaVersion: number;
};

export interface ShortcutOverridesStore {
  list: () => Promise<{ overrides: ShortcutOverride[] }>;
  setOverride: (input: {
    shortcutId: ShortcutId;
    hotkey: string;
  }) => Promise<ShortcutOverrideRecord>;
  resetOverride: (input: { shortcutId: ShortcutId }) => Promise<unknown>;
  resetAll: () => Promise<unknown>;
}

/** Duck-typed surface of `trpc.shortcuts`. */
export type ShortcutOverridesTrpcApi = {
  list: { query: () => Promise<{ overrides: ShortcutOverride[] }> };
  setOverride: { mutate: (input: unknown) => Promise<ShortcutOverrideRecord> };
  resetOverride: { mutate: (input: unknown) => Promise<unknown> };
  resetAll: { mutate: () => Promise<unknown> };
};

export function createTrpcShortcutOverridesStore(
  api: ShortcutOverridesTrpcApi,
): ShortcutOverridesStore {
  return {
    list: () => api.list.query(),
    setOverride: (input) => api.setOverride.mutate(input),
    resetOverride: (input) => api.resetOverride.mutate(input),
    resetAll: () => api.resetAll.mutate(),
  };
}
