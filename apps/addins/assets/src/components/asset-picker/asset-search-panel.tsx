import { CircleNotch, type Icon } from "@phosphor-icons/react";
import { useCallback, useId, useRef } from "react";
import { toast } from "sonner";

import { ShortcutKeys } from "@/components/shortcut-hint";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useAssetSearchHotkeys } from "@/hooks/use-asset-search-hotkeys";
import type { AssetDetailsResponse, AssetListItem, AssetPanelMode, AssetType } from "@/lib/asset-types";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";
import { SHORTCUTS } from "@/lib/shortcuts";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { InsertSection } from "./insert-section";
import { ScreenHeader } from "./screen-header";
import { getSearchResultOptionId, SearchResults } from "./search-results";
import { SearchSection } from "./search-section";
import { SelectedEntityHeader } from "./selected-entity-header";
import { VariantGrid } from "./variant-grid";
import { VariantsSection } from "./variants-section";

interface InsertContext {
  details: AssetDetailsResponse;
  variantId: string;
}

interface AssetSearchPanelProps {
  mode: AssetPanelMode;
  assetType: AssetType;
  /** Singular, capitalized noun used to derive titles and messages, e.g. "Logo". */
  assetLabel: string;
  headerText: string;
  searchPlaceholder: string;
  icon: Icon;
  noResultsDescription: string;
  noVariantsDescription: string;
  search: (query: string) => Promise<AssetListItem[]>;
  getDetails: (id: string) => Promise<AssetDetailsResponse>;
  onInsert: (context: InsertContext) => Promise<void>;
}

export function AssetSearchPanel({
  mode,
  assetType,
  assetLabel,
  headerText,
  searchPlaceholder,
  icon: Icon,
  noResultsDescription,
  noVariantsDescription,
  search,
  getDetails,
  onInsert,
}: AssetSearchPanelProps) {
  const flow = useAssetSearchFlow({ search, getDetails });
  const webCanvas = useWebCanvasOptional();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();

  const label = assetLabel.toLowerCase();
  const showsSearchResults = !flow.selectedEntity && !flow.searchError && flow.results.length > 0;
  const activeSearchResultId =
    showsSearchResults && flow.highlightedResultId
      ? getSearchResultOptionId(searchResultsId, flow.highlightedResultId)
      : undefined;

  const handleInsert = useCallback(async () => {
    if (!flow.selectedEntity || !flow.selectedVariantId || !flow.details) {
      return;
    }

    await runInsertion(async () => {
      if (mode === "web") {
        const variant = flow.details!.variants.find((item) => item.id === flow.selectedVariantId);

        if (!variant) {
          toast.error("Variant not found");
          return;
        }

        if (!webCanvas) {
          toast.error("Canvas not available");
          return;
        }

        webCanvas.addToCanvas({
          variantId: variant.id,
          name: flow.details!.name,
          imageUrl: variant.imageUrl,
          insert: variant.insert,
          metadata: flow.details!.metadata,
        });

        trackAssetInsertion({
          assetType,
          externalId: flow.details!.id,
          client: "web",
          metadata: {
            variantId: variant.id,
            ...flow.details!.metadata,
          },
        });

        toast.success(`${assetLabel} added to canvas`);
        return;
      }

      await onInsert({
        details: flow.details!,
        variantId: flow.selectedVariantId!,
      });

      toast.success(`${assetLabel} inserted`);
    }).catch((error) => {
      console.error(`Error inserting ${label}:`, error);
      toast.error(error instanceof Error ? error.message : `Error inserting ${label}`);
    });
  }, [
    assetLabel,
    assetType,
    flow.details,
    flow.selectedEntity,
    flow.selectedVariantId,
    label,
    mode,
    onInsert,
    runInsertion,
    webCanvas,
  ]);

  useAssetSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {flow.isSearching
          ? `Searching for ${label}s`
          : flow.isFetchingVariants
            ? `Loading ${label} variants`
            : ""}
      </div>
      <ScreenHeader title={`${assetLabel}s`} text={headerText} />

      <div className="px-4 pt-4">
        <SearchSection
          searchRef={searchInputRef}
          value={flow.searchValue}
          onChange={flow.setSearchValue}
          isSearching={flow.isSearching}
          placeholder={searchPlaceholder}
          resultsId={showsSearchResults ? searchResultsId : undefined}
          activeDescendantId={activeSearchResultId}
          isExpanded={showsSearchResults}
          searchRightSlot={
            <ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} className="opacity-70" />
          }
        >
          {!flow.selectedEntity ? (
            flow.searchError ? (
              <ErrorState
                title={`Could not search for ${label}s`}
                description="Check your connection and try again."
                onRetry={flow.retrySearch}
              />
            ) : flow.results.length > 0 ? (
              <SearchResults
                id={searchResultsId}
                results={flow.results}
                highlightedId={flow.highlightedResultId}
                onSelect={(id) => void flow.selectEntity(id)}
              />
            ) : flow.hasSearched && !flow.isSearching ? (
              <EmptyState
                icon={Icon}
                title={`No ${label}s found`}
                description={noResultsDescription}
              />
            ) : null
          ) : null}
        </SearchSection>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {flow.selectedEntity ? (
          <div className="mt-4 flex flex-col gap-4">
            <SelectedEntityHeader entity={flow.selectedEntity} />

            {flow.isFetchingVariants ? (
              <div
                className="flex items-center justify-center py-8"
                role="status"
                aria-label={`Loading ${label} variants`}
              >
                <CircleNotch className="size-8 animate-spin motion-reduce:animate-none" />
              </div>
            ) : flow.variantsError ? (
              <ErrorState
                title="Could not load variants"
                description="Check your connection and try again."
                onRetry={flow.retryVariants}
              />
            ) : flow.variants.length > 0 ? (
              <VariantsSection>
                <VariantGrid
                  variants={flow.variants}
                  highlightedId={flow.highlightedVariantId}
                  selectedId={flow.selectedVariantId}
                  onSelect={flow.selectVariant}
                />
              </VariantsSection>
            ) : (
              <EmptyState
                icon={Icon}
                title="No variants available"
                description={noVariantsDescription}
              />
            )}

            <InsertSection
              disabled={!flow.selectedVariantId}
              isInserting={isInserting}
              label={mode === "web" ? "Add to canvas" : "Insert"}
              insertingLabel={mode === "web" ? "Adding..." : "Inserting..."}
              onClick={handleInsert}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
