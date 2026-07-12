import { Shapes } from "@phosphor-icons/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useShapeLibrary } from "@/hooks/use-shape-library";
import type { AssetPanelMode } from "@/lib/asset-types";
import { insertShape } from "@/lib/insert-shape";

import { ShapeCategoryTabs } from "./shape-category-tabs";
import { ShapeGrid } from "./shape-grid";
import type { ShapeSearchRequest, ShapeSearchResponse } from "./types";
import { useShapeLibraryHotkeys } from "./use-shape-library-hotkeys";

interface ShapeLibraryPanelProps {
  mode: AssetPanelMode;
  search: (input: ShapeSearchRequest) => Promise<ShapeSearchResponse>;
}

export function ShapeLibraryPanel({ mode, search }: ShapeLibraryPanelProps) {
  const flow = useShapeLibrary(search);
  const webCanvas = useWebCanvasOptional();
  const { isInserting, runInsertion } = useAssetInsertion();
  const isOffice = mode === "office";

  const handleInsert = useCallback(async () => {
    const shape = flow.selectedShape;

    if (!shape) {
      return;
    }

    await runInsertion(async () => {
      await insertShape({ mode, shape, webCanvas });
      toast.success(mode === "web" ? "Shape added to canvas" : "Shape inserted");
    }).catch((error) => {
      console.error("Error inserting shape:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting shape");
    });
  }, [flow.selectedShape, mode, runInsertion, webCanvas]);

  useShapeLibraryHotkeys({
    flow,
    onInsert: handleInsert,
    isInserting,
    canInsert: Boolean(flow.selectedShape),
  });

  const emptyDescription = flow.category
    ? `More ${flow.category.toLowerCase()} coming soon.`
    : "More shapes coming soon.";

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
          {!isOffice ? (
            <p className="text-center text-xs text-muted-foreground">
              Shapes can be added to the web canvas here. Open this add-in in PowerPoint to insert
              directly into a slide.
            </p>
          ) : null}
          <InsertSection
            disabled={!flow.selectedShape}
            isInserting={isInserting}
            label={mode === "web" ? "Add to canvas" : "Insert"}
            insertingLabel={mode === "web" ? "Adding..." : "Inserting..."}
            onClick={handleInsert}
          />
        </div>
      </div>
    </div>
  );
}
