import { useCallback } from "react";
import { toast } from "sonner";

import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { useInsertSectionShortcutDefs } from "@/hooks/use-resolved-shortcut-defs";
import { useShapeLibrary } from "@/hooks/use-shape-library";

import type { ShapeSearchRequest, ShapeSearchResponse } from "./types";
import { useShapeLibraryHotkeys } from "./use-shape-library-hotkeys";

async function fetchSvgText(svgUrl: string): Promise<string> {
  const response = await fetch(svgUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch shape SVG (${response.status})`);
  }

  return response.text();
}

export function useShapeLibraryController(
  search: (input: ShapeSearchRequest) => Promise<ShapeSearchResponse>,
) {
  const flow = useShapeLibrary(search);
  const insertionStrategy = useInsertionStrategy();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();
  const { isInserting, runInsertion } = useAssetInsertion();

  const handleInsert = useCallback(async () => {
    const shape = flow.selectedShape;

    if (!shape || !insertionStrategy) {
      return;
    }

    await runInsertion(async () => {
      const svg = await fetchSvgText(shape.svgUrl);
      const metadata = {
        SHAPE_ID: shape.id,
        CATEGORY: shape.category,
        TYPE: "SHAPE",
      };

      await insertionStrategy.insert({
        variantId: shape.id,
        name: shape.name,
        imageUrl: shape.thumbnailUrl,
        insert: { type: "svg", svg },
        metadata,
        assetType: "shape",
        externalId: shape.id,
      });

      toast.success(
        insertionStrategy.verb === "Insert" ? "Shape inserted" : "Shape added to canvas",
      );
    }).catch((error) => {
      console.error("Error inserting shape:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting shape");
    });
  }, [flow.selectedShape, insertionStrategy, runInsertion]);

  const canInsert = Boolean(flow.selectedShape) && Boolean(insertionStrategy);

  useShapeLibraryHotkeys({
    flow,
    onInsert: handleInsert,
    isInserting,
    canInsert,
  });

  const emptyDescription = flow.category
    ? `More ${flow.category.toLowerCase()} coming soon.`
    : "More shapes coming soon.";

  const insertLabel = insertionStrategy?.verb ?? "Insert";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return {
    flow,
    emptyDescription,
    isInserting,
    handleInsert,
    insertLabel,
    insertingLabel,
    insertDisabled: !canInsert,
    insertSectionShortcutDefs,
  };
}

export type ShapeLibraryController = ReturnType<typeof useShapeLibraryController>;
