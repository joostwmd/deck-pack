import { Button } from "@deck-pack/ui/components/system/button";
import { CircleNotch, ImageSquare } from "@phosphor-icons/react";
import { useCallback, useId, useRef } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { SearchBar } from "@/components/asset-picker/search-bar";
import { ShortcutKeys } from "@/components/shortcut-hint";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import { SHORTCUTS } from "@/lib/shortcuts";

import { PhotoFiltersBar } from "./photo-filters";
import { PhotoGrid } from "./photo-grid";
import type { PhotoSearchRequest, PhotoSearchResponse } from "./types";
import { usePhotoSearch } from "./use-photo-search";
import { usePhotoSearchHotkeys } from "./use-photo-search-hotkeys";

interface PhotoSearchPanelProps {
  search: (input: PhotoSearchRequest) => Promise<PhotoSearchResponse>;
}

export function PhotoSearchPanel({ search }: PhotoSearchPanelProps) {
  const flow = usePhotoSearch(search);
  const insertionStrategy = useInsertionStrategy();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();

  const showsResults = !flow.error && flow.results.length > 0;
  const activeResultId = showsResults && flow.highlightedPhotoId ? flow.highlightedPhotoId : undefined;

  const handleInsert = useCallback(async () => {
    const photo = flow.selectedPhoto;

    if (!photo || !insertionStrategy) {
      return;
    }

    await runInsertion(async () => {
      await insertionStrategy.insert({
        variantId: photo.id,
        name: photo.name,
        imageUrl: photo.insertImageUrl,
        insert: {
          type: "image",
          imageUrl: photo.insertImageUrl,
        },
        metadata: photo.metadata,
        assetType: "photo",
        externalId: photo.id,
      });

      toast.success(
        insertionStrategy.verb === "Insert" ? "Photo inserted" : "Photo added to canvas",
      );
    }).catch((error) => {
      console.error("Error inserting photo:", error);
      toast.error(error instanceof Error ? error.message : "Error inserting photo");
    });
  }, [flow.selectedPhoto, insertionStrategy, runInsertion]);

  usePhotoSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
  });

  const insertLabel = insertionStrategy?.verb ?? "Insert";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return (
    <div className="flex flex-1 flex-col">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {flow.isSearching
          ? "Searching for photos"
          : flow.isLoadingMore
            ? "Loading more photos"
            : flow.hasSearched && flow.results.length > 0
              ? `${flow.results.length} photos loaded`
              : ""}
      </div>

      <ScreenHeader title="Images" text="Search and insert Pexels photos." />

      <div className="px-4 pt-3">
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
              rightSlot={
                <ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} className="opacity-70" />
              }
            />

            <PhotoFiltersBar
              filters={flow.filters}
              activeFilterCount={flow.activeFilterCount}
              onChange={flow.updateFilters}
            />
          </div>

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
        </section>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-3">
        <div className="mt-auto flex flex-col gap-2 pt-3">
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
            disabled={!flow.selectedPhoto || !insertionStrategy}
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
