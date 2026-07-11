import { useHotkeys } from "@tanstack/react-hotkeys";

import type { AssetTab } from "@/lib/asset-types";
import { SHORTCUTS } from "@/lib/shortcuts";

interface UseAssetTabHotkeysOptions {
  onTabChange: (tab: AssetTab) => void;
  onOpenHelp: () => void;
}

export function useAssetTabHotkeys({ onTabChange, onOpenHelp }: UseAssetTabHotkeysOptions) {
  useHotkeys([
    {
      hotkey: SHORTCUTS.logos.hotkey,
      callback: () => onTabChange("logos"),
      options: {
        meta: { name: SHORTCUTS.logos.id, description: SHORTCUTS.logos.description },
      },
    },
    {
      hotkey: SHORTCUTS.flags.hotkey,
      callback: () => onTabChange("flags"),
      options: {
        meta: { name: SHORTCUTS.flags.id, description: SHORTCUTS.flags.description },
      },
    },
    {
      hotkey: SHORTCUTS.icons.hotkey,
      callback: () => onTabChange("icons"),
      options: {
        meta: { name: SHORTCUTS.icons.id, description: SHORTCUTS.icons.description },
      },
    },
    {
      hotkey: SHORTCUTS.harveyBalls.hotkey,
      callback: () => onTabChange("harvey-balls"),
      options: {
        meta: {
          name: SHORTCUTS.harveyBalls.id,
          description: SHORTCUTS.harveyBalls.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.openHelp.hotkey,
      callback: () => onOpenHelp(),
      options: {
        meta: { name: SHORTCUTS.openHelp.id, description: SHORTCUTS.openHelp.description },
      },
    },
  ]);
}
