import { useHotkeys } from "@tanstack/react-hotkeys";

import type { useShapeLibrary } from "@/hooks/use-shape-library";
import { SHORTCUTS } from "@/lib/shortcuts";

type ShapeLibraryFlow = ReturnType<typeof useShapeLibrary>;

interface UseShapeLibraryHotkeysOptions {
  flow: ShapeLibraryFlow;
  onInsert: () => void | Promise<void>;
  isInserting: boolean;
  canInsert: boolean;
}

export function useShapeLibraryHotkeys({
  flow,
  onInsert,
  isInserting,
  canInsert,
}: UseShapeLibraryHotkeysOptions) {
  useHotkeys([
    {
      hotkey: SHORTCUTS.navigateVariantsUp.hotkey,
      callback: () => flow.navigateShapes("up"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsUp.id,
          description: "Navigate shapes up",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsDown.hotkey,
      callback: () => flow.navigateShapes("down"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsDown.id,
          description: "Navigate shapes down",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsLeft.hotkey,
      callback: () => flow.navigateShapes("left"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsLeft.id,
          description: "Navigate shapes left",
        },
      },
    },
    {
      hotkey: SHORTCUTS.navigateVariantsRight.hotkey,
      callback: () => flow.navigateShapes("right"),
      options: {
        meta: {
          name: SHORTCUTS.navigateVariantsRight.id,
          description: "Navigate shapes right",
        },
      },
    },
    {
      hotkey: SHORTCUTS.selectVariant.hotkey,
      callback: () => flow.confirmHighlightedShape(),
      options: {
        meta: {
          name: SHORTCUTS.selectVariant.id,
          description: "Select shape",
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
