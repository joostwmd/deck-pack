import { Shapes } from "@phosphor-icons/react";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";

import { ShapeCategoryTabs } from "./shape-category-tabs";
import { ShapeGrid } from "./shape-grid";
import type { ShapeLibraryController } from "./use-shape-library-controller";

interface ShapeLibraryViewProps {
  controller: ShapeLibraryController;
}

export function ShapeLibraryView({ controller }: ShapeLibraryViewProps) {
  const {
    flow,
    emptyDescription,
    isInserting,
    handleInsert,
    insertLabel,
    insertingLabel,
    insertDisabled,
    insertSectionShortcutDefs,
  } = controller;

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
            disabled={insertDisabled}
            isInserting={isInserting}
            label={insertLabel}
            insertingLabel={insertingLabel}
            shortcutDefs={insertSectionShortcutDefs}
            onClick={handleInsert}
          />
        </div>
      </div>
    </div>
  );
}
