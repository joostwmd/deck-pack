import type { RefObject } from "react";

import { useShortcutCommands } from "@/hooks/use-shortcut-commands";

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
  useShortcutCommands([
    {
      id: "focusSearch",
      execute: () => searchInputRef.current?.focus(),
    },
    {
      id: "navigateVariantsUp",
      execute: () => flow.navigatePhotos("up"),
    },
    {
      id: "navigateVariantsDown",
      execute: () => flow.navigatePhotos("down"),
    },
    {
      id: "navigateVariantsLeft",
      execute: () => flow.navigatePhotos("left"),
    },
    {
      id: "navigateVariantsRight",
      execute: () => flow.navigatePhotos("right"),
    },
    {
      id: "selectVariant",
      execute: () => flow.confirmHighlightedPhoto(),
    },
    {
      id: "insert",
      execute: () => {
        if (!isInserting) {
          void onInsert();
        }
      },
    },
  ]);
}
