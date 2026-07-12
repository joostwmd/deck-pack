import { PresentationChart } from "@phosphor-icons/react";
import { useCallback, useId, useRef } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { SearchBar } from "@/components/asset-picker/search-bar";
import { PowerPointGuard } from "@/components/power-point-guard";
import { ShortcutKeys } from "@/components/shortcut-hint";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useSlideSearch } from "@/hooks/use-slide-search";
import { insertSlide } from "@/lib/insert-slide";
import { SHORTCUTS } from "@/lib/shortcuts";

import { SlideFiltersBar } from "./slide-filters";
import { SlideGrid } from "./slide-grid";
import type { SlideSearchRequest, SlideSearchResponse } from "./types";
import { useSlideSearchHotkeys } from "./use-slide-search-hotkeys";

interface SlideSearchPanelProps {
  search: (input: SlideSearchRequest) => Promise<SlideSearchResponse>;
}

function SlideSearchPanelContent({ search }: SlideSearchPanelProps) {
  const { isOfficeAvailable } = useEnvironment();
  const flow = useSlideSearch(search);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();

  const showsResults = !flow.error && flow.results.length > 0;
  const activeResultId = showsResults && flow.highlightedSlideId ? flow.highlightedSlideId : undefined;

  const handleInsert = useCallback(async () => {
    const slide = flow.selectedSlide;

    if (!slide) {
      return;
    }

    await runInsertion(async () => {
      await insertSlide(slide);
      toast.success("Slide inserted");
    }).catch((error) => {
      console.error("Error inserting slide:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting slide");
    });
  }, [flow.selectedSlide, runInsertion]);

  useSlideSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
    canInsert: isOfficeAvailable && Boolean(flow.selectedSlide),
  });

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
            rightSlot={<ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} className="opacity-70" />}
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
            disabled={!flow.selectedSlide}
            isInserting={isInserting}
            label="Insert"
            insertingLabel="Inserting..."
            onClick={handleInsert}
          />
        </div>
      </div>
    </div>
  );
}

export function SlideSearchPanel({ search }: SlideSearchPanelProps) {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Slides"
        text="Browse and insert slide templates into your presentation."
      />
      <PowerPointGuard powerpointRequired>
        <SlideSearchPanelContent search={search} />
      </PowerPointGuard>
    </div>
  );
}
