import { Shapes } from "@phosphor-icons/react";

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
        <ShapeCategoryTabs
          categories={flow.facets.categories}
          activeCategory={flow.category}
          onChange={flow.updateCategory}
        />
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
