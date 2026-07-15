import { useShortcutCommands } from "@/hooks/use-shortcut-commands";
import type { useShapeLibrary } from "@/hooks/use-shape-library";

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
  useShortcutCommands([
    {
      id: "navigateVariantsUp",
      execute: () => flow.navigateShapes("up"),
    },
    {
      id: "navigateVariantsDown",
      execute: () => flow.navigateShapes("down"),
    },
    {
      id: "navigateVariantsLeft",
      execute: () => flow.navigateShapes("left"),
    },
    {
      id: "navigateVariantsRight",
      execute: () => flow.navigateShapes("right"),
    },
    {
      id: "selectVariant",
      execute: () => flow.confirmHighlightedShape(),
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
