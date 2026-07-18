import { PresentationChart } from "@phosphor-icons/react";

import { EmptyState } from "@/components/asset-browser/empty-state";
import { ErrorState } from "@/components/asset-browser/error-state";
import { InsertSection } from "@/components/asset-browser/insert-section";
import { SearchBar } from "@/components/asset-browser/search-bar";
import { ShortcutKeys } from "@/components/shortcuts/shortcut-hint";

import { SlideFiltersBar } from "./slide-filters";
import { SlideGrid } from "./slide-grid";
import type { SlideSearchController } from "@/hooks/use-slide-search-controller";

interface SlideSearchViewProps {
  controller: SlideSearchController;
}

export function SlideSearchView({ controller }: SlideSearchViewProps) {
  const {
    flow,
    searchInputRef,
    resultsId,
    showsResults,
    activeResultId,
    focusSearchShortcut,
    isInserting,
    handleInsert,
    insertDisabled,
    insertSectionShortcutDefs,
  } = controller;

  return (
    <div className="flex flex-1 flex-col">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {flow.isSearching
          ? "Searching for slides"
          : flow.hasLoaded && flow.results.length > 0
            ? `${flow.results.length} slides loaded`
            : ""}
      </div>

      <div className="px-4 pt-3">
        <section className="flex flex-col gap-3">
          <SearchBar
            ref={searchInputRef}
            value={flow.queryInput}
            onChange={flow.setQueryInput}
            isSearching={flow.isSearching}
            placeholder="Search slides..."
            resultsId={showsResults ? resultsId : undefined}
            activeDescendantId={activeResultId}
            isExpanded={showsResults}
            rightSlot={<ShortcutKeys tokens={focusSearchShortcut.keys} className="opacity-70" />}
          />

          <SlideFiltersBar
            filters={flow.filters}
            facets={flow.facets}
            activeFilterCount={flow.activeFilterCount}
            sort={flow.sort}
            onFiltersChange={flow.updateFilters}
            onSortChange={flow.updateSort}
          />

          {flow.error ? (
            <ErrorState
              title="Could not search for slides"
              description={flow.error}
              onRetry={flow.retry}
            />
          ) : flow.isSearching && !flow.hasLoaded ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading slides...</p>
          ) : flow.results.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {flow.total.toLocaleString()} results
                {flow.activeFilterCount > 0 || flow.normalizedQuery ? " · filtered" : ""}
              </p>
              <SlideGrid
                slides={flow.results}
                highlightedId={flow.highlightedSlideId}
                selectedId={flow.selectedId}
                onSelect={flow.selectSlide}
              />
            </div>
          ) : flow.hasLoaded && !flow.isSearching ? (
            <EmptyState
              icon={PresentationChart}
              title="No slides found"
              description="Try a different keyword or clear your filters to browse the library."
            />
          ) : null}
        </section>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-3">
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <InsertSection
            disabled={insertDisabled}
            isInserting={isInserting}
            label="Insert"
            insertingLabel="Inserting..."
            shortcutDefs={insertSectionShortcutDefs}
            onClick={handleInsert}
          />
        </div>
      </div>
    </div>
  );
}
