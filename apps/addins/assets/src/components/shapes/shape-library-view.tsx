import { Shapes } from "@phosphor-icons/react";

import { FiltersPopover } from "@/components/asset-browser/filters-popover";
import { InternalOnlyFilterField } from "@/components/asset-browser/internal-only-filter-field";
import { AssetBrowserShell } from "@/components/asset-browser/asset-browser-shell";
import { EmptyState } from "@/components/asset-browser/empty-state";
import { ErrorState } from "@/components/asset-browser/error-state";
import { InsertSection } from "@/components/asset-browser/insert-section";
import { ScreenHeader } from "@/components/asset-browser/screen-header";
import type { ShapeLibraryController } from "@/hooks/use-shape-library-controller";

import { ShapeCategoryTabs } from "./shape-category-tabs";
import { ShapeGrid } from "./shape-grid";

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

  const liveMessage = flow.isLoading
    ? "Loading shapes"
    : flow.hasLoaded && flow.results.length > 0
      ? `${flow.results.length} shapes loaded`
      : "";

  return (
    <AssetBrowserShell
      liveMessage={liveMessage}
      header={
        <ScreenHeader
          title="Shapes"
          text="Browse and insert advanced shapes into your presentation."
        />
      }
      toolbar={
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ShapeCategoryTabs
              categories={flow.facets.categories}
              activeCategory={flow.category}
              onChange={flow.updateCategory}
            />
          </div>
          <FiltersPopover
            activeFilterCount={flow.internalOnly ? 1 : 0}
            ariaLabel="Open shape filters"
            onClearAll={() => flow.updateInternalOnly(false)}
          >
            <InternalOnlyFilterField
              id="shape-internal-only-filter"
              checked={flow.internalOnly}
              onCheckedChange={flow.updateInternalOnly}
            />
          </FiltersPopover>
        </div>
      }
      results={
        <>
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
                {flow.internalOnly ? " · internal only" : ""}
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
        </>
      }
      footer={
        <InsertSection
          disabled={insertDisabled}
          isInserting={isInserting}
          label={insertLabel}
          insertingLabel={insertingLabel}
          shortcutDefs={insertSectionShortcutDefs}
          onClick={handleInsert}
        />
      }
    />
  );
}
