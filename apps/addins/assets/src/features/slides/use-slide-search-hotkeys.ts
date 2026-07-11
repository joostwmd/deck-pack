import { useHotkeys } from "@tanstack/react-hotkeys";
import type { RefObject } from "react";

import type { useSlideSearch } from "@/hooks/use-slide-search";
import { SHORTCUTS } from "@/lib/shortcuts";

type SlideSearchFlow = ReturnType<typeof useSlideSearch>;

interface UseSlideSearchHotkeysOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  flow: SlideSearchFlow;
  onInsert: () => void | Promise<void>;
  isInserting: boolean;
  canInsert: boolean;
}

export function useSlideSearchHotkeys({
  searchInputRef,
  flow,
  onInsert,
  isInserting,
  canInsert,
}: UseSlideSearchHotkeysOptions) {
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
      callback: () => flow.navigateSlides("up"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsUp.id,
          description: "Navigate slides up",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsDown.hotkey,
      callback: () => flow.navigateSlides("down"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsDown.id,
          description: "Navigate slides down",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsLeft.hotkey,
      callback: () => flow.navigateSlides("left"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsLeft.id,
          description: "Navigate slides left",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsRight.hotkey,
      callback: () => flow.navigateSlides("right"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsRight.id,
          description: "Navigate slides right",
        },
      },
    },
    {
      hotkey: SHORTCUTS.selectVariant.hotkey,
      callback: () => flow.confirmHighlightedSlide(),
      options: {
        meta: {
          name: SHORTCUTS.selectVariant.id,
          description: "Select slide",
        },
      },
    },
    {
      hotkey: SHORTCUTS.insert.hotkey,
      callback: () => {
        if (!isInserting && canInsert) {
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
