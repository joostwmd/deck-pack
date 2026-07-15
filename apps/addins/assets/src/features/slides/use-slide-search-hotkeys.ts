import type { RefObject } from "react";

import { useShortcutCommands } from "@/hooks/use-shortcut-commands";
import type { useSlideSearch } from "@/hooks/use-slide-search";

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
  useShortcutCommands([
    {
      id: "focusSearch",
      execute: () => searchInputRef.current?.focus(),
    },
    {
      id: "navigateVariantsUp",
      execute: () => flow.navigateSlides("up"),
    },
    {
      id: "navigateVariantsDown",
      execute: () => flow.navigateSlides("down"),
    },
    {
      id: "navigateVariantsLeft",
      execute: () => flow.navigateSlides("left"),
    },
    {
      id: "navigateVariantsRight",
      execute: () => flow.navigateSlides("right"),
    },
    {
      id: "selectVariant",
      execute: () => flow.confirmHighlightedSlide(),
    },
    {
      id: "insert",
      execute: () => {
        if (!isInserting && canInsert) {
          void onInsert();
        }
      },
      enabled: canInsert && !isInserting,
    },
  ]);
}
