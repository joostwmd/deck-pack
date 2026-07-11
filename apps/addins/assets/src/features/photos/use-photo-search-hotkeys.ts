import { useHotkeys } from "@tanstack/react-hotkeys";
import type { RefObject } from "react";

import { SHORTCUTS } from "@/lib/shortcuts";

import type { usePhotoSearch } from "./use-photo-search";

type PhotoSearchFlow = ReturnType<typeof usePhotoSearch>;

interface UsePhotoSearchHotkeysOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  flow: PhotoSearchFlow;
  onInsert: () => void | Promise<void>;
  isInserting: boolean;
}

export function usePhotoSearchHotkeys({
  searchInputRef,
  flow,
  onInsert,
  isInserting,
}: UsePhotoSearchHotkeysOptions) {
  useHotkeys([
    {
      hotkey: SHORTCUTS.focusSearch.hotkey,
      callback: () => searchInputRef.current?.focus(),
      options: {
        meta: {
          name: SHORTCUTS.focusSearch.id,
          description: SHORTCUTS.focusSearch.description,
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsUp.hotkey,
      callback: () => flow.navigatePhotos("up"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsUp.id,
          description: "Navigate photos up",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsDown.hotkey,
      callback: () => flow.navigatePhotos("down"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsDown.id,
          description: "Navigate photos down",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsLeft.hotkey,
      callback: () => flow.navigatePhotos("left"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsLeft.id,
          description: "Navigate photos left",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsRight.hotkey,
      callback: () => flow.navigatePhotos("right"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsRight.id,
          description: "Navigate photos right",
        },
      },
    },
    {
      hotkey: SHORTCUTS.selectVariant.hotkey,
      callback: () => flow.confirmHighlightedPhoto(),
      options: {
        meta: {
          name: SHORTCUTS.selectVariant.id,
          description: "Select photo",
        },
      },
    },
    {
      hotkey: SHORTCUTS.insert.hotkey,
      callback: () => {
        if (!isInserting) {
          void onInsert();
        }
      },
      options: {
        meta: {
          name: SHORTCUTS.insert.id,
          description: SHORTCUTS.insert.description,
        },
      },
    },
  ]);
}
