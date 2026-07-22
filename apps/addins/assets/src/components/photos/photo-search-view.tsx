import { Button } from "@deck-pack/ui/components/system/button";
import { CircleNotch, ImageSquare } from "@phosphor-icons/react";

import { AssetBrowserShell } from "@/components/asset-browser/asset-browser-shell";
import { EmptyState } from "@/components/asset-browser/empty-state";
import { ErrorState } from "@/components/asset-browser/error-state";
import { InsertSection } from "@/components/asset-browser/insert-section";
import { ScreenHeader } from "@/components/asset-browser/screen-header";
import { SearchBar } from "@/components/asset-browser/search-bar";
import { ShortcutKeys } from "@/components/shortcuts/shortcut-hint";
import type { PhotoSearchController } from "@/hooks/photos/use-photo-search-controller";

import { PhotoFiltersBar } from "./photo-filters";
import { PhotoGrid } from "./photo-grid";

interface PhotoSearchViewProps {
  controller: PhotoSearchController;
}

export function PhotoSearchView({ controller }: PhotoSearchViewProps) {
  const {
    flow,
    searchInputRef,
    resultsId,
    showsResults,
    activeResultId,
    focusSearchShortcut,
    isInserting,
    handleInsert,
    insertLabel,
    insertingLabel,
    insertDisabled,
    insertSectionShortcutDefs,
  } = controller;

  const liveMessage = flow.isSearching
    ? "Searching for photos"
    : flow.isLoadingMore
      ? "Loading more photos"
      : flow.hasSearched && flow.results.length > 0
        ? `${flow.results.length} photos loaded`
        : "";

  return (
    <AssetBrowserShell
      liveMessage={liveMessage}
      header={<ScreenHeader title="Images" text="Search and insert Pexels photos." />}
      toolbar={
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <SearchBar
              ref={searchInputRef}
              value={flow.queryInput}
              onChange={flow.setQueryInput}
              isSearching={flow.isSearching}
              placeholder="Search photos..."
              onSubmit={flow.submitSearch}
              resultsId={showsResults ? resultsId : undefined}
              activeDescendantId={activeResultId}
              isExpanded={showsResults}
              className="min-w-0 flex-1"
              rightSlot={<ShortcutKeys tokens={focusSearchShortcut.keys} className="opacity-70" />}
            />

            <PhotoFiltersBar
              filters={flow.filters}
              activeFilterCount={flow.activeFilterCount}
              onChange={flow.updateFilters}
            />
          </div>
        </section>
      }
      results={
        <>
          {!flow.submittedQuery && !flow.hasSearched ? (
            <EmptyState
              icon={ImageSquare}
              title="Search for photos"
              description="Enter a keyword and press Enter. Open Filters to narrow results."
            />
          ) : flow.error ? (
            <ErrorState
              title="Could not search for photos"
              description={flow.error}
              onRetry={flow.retry}
            />
          ) : flow.results.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {flow.totalResults.toLocaleString()} results
                {flow.activeFilterCount > 0 ? " · filtered" : ""}
              </p>
              <PhotoGrid
                photos={flow.results}
                highlightedId={flow.highlightedPhotoId}
                selectedId={flow.selectedId}
                onSelect={flow.selectPhoto}
              />
              {flow.hasNextPage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={flow.isLoadingMore || flow.isSearching}
                  onClick={() => void flow.loadMore()}
                >
                  {flow.isLoadingMore ? (
                    <>
                      <CircleNotch
                        className="size-4 animate-spin motion-reduce:animate-none"
                        aria-hidden
                      />
                      Loading more...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              ) : null}
            </div>
          ) : flow.hasSearched && !flow.isSearching ? (
            <EmptyState
              icon={ImageSquare}
              title="No photos found"
              description="Try a different keyword or clear your filters to broaden the search."
            />
          ) : null}
        </>
      }
      footer={
        <>
          <p className="text-center text-[10px] text-muted-foreground">
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Photos provided by Pexels
            </a>
          </p>
          <InsertSection
            disabled={insertDisabled}
            isInserting={isInserting}
            label={insertLabel}
            insertingLabel={insertingLabel}
            shortcutDefs={insertSectionShortcutDefs}
            onClick={handleInsert}
          />
        </>
      }
    />
  );
}
