import { Shapes } from "@phosphor-icons/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { useShapeLibrary } from "@/hooks/use-shape-library";

import { ShapeCategoryTabs } from "./shape-category-tabs";
import { ShapeGrid } from "./shape-grid";
import type { ShapeSearchRequest, ShapeSearchResponse } from "./types";
import { useShapeLibraryHotkeys } from "./use-shape-library-hotkeys";

interface ShapeLibraryPanelProps {
  search: (input: ShapeSearchRequest) => Promise<ShapeSearchResponse>;
}

async function fetchSvgText(svgUrl: string): Promise<string> {
  const response = await fetch(svgUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch shape SVG (${response.status})`);
  }

  return response.text();
}

export function ShapeLibraryPanel({ search }: ShapeLibraryPanelProps) {
  const flow = useShapeLibrary(search);
  const insertionStrategy = useInsertionStrategy();
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

  useShapeLibraryHotkeys({
    flow,
    onInsert: handleInsert,
    isInserting,
    canInsert: Boolean(flow.selectedShape) && Boolean(insertionStrategy),
  });

  const emptyDescription = flow.category
    ? `More ${flow.category.toLowerCase()} coming soon.`
    : "More shapes coming soon.";

  const insertLabel = insertionStrategy?.verb ?? "Insert";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return (
    <div className="flex flex-1 flex-col">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {flow.isLoading
          ? "Loading shapes"
          : flow.hasLoaded && flow.results.length > 0
            ? `${flow.results.length} shapes loaded`
            : ""}
      </div>

      <ScreenHeader
        title="Shapes"
        text="Browse and insert advanced shapes into your presentation."
      />

      <div className="px-4 pt-3">
        <section className="flex flex-col gap-3">
          <ShapeCategoryTabs
            categories={flow.facets.categories}
            activeCategory={flow.category}
            onChange={flow.updateCategory}
          />

          {flow.error ? (
            <ErrorState
              title="Could not load shapes"
              description={flow.error}
              onRetry={flow.retry}
            />
          ) : flow.isLoading && !flow.hasLoaded ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading shapes...</p>
          ) : flow.results.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {flow.total.toLocaleString()} shapes
                {flow.category ? ` · ${flow.category}` : ""}
              </p>
              <ShapeGrid
                shapes={flow.results}
                highlightedId={flow.highlightedShapeId}
                selectedId={flow.selectedId}
                onSelect={flow.selectShape}
              />
            </div>
          ) : flow.hasLoaded && !flow.isLoading ? (
            <EmptyState
              icon={Shapes}
              title="No shapes in this category yet"
              description={emptyDescription}
            />
          ) : null}
        </section>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-3">
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <InsertSection
            disabled={!flow.selectedShape || !insertionStrategy}
            isInserting={isInserting}
            label={insertLabel}
            insertingLabel={insertingLabel}
            onClick={handleInsert}
          />
        </div>
      </div>
    </div>
  );
}
