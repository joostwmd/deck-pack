import { CircleNotch, type Icon } from "@phosphor-icons/react";
import type { RefObject } from "react";

import { ShortcutKeys } from "@/components/shortcuts/shortcut-hint";
import type { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import type { KeyToken, ShortcutDef } from "@/lib/shortcuts";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { InsertSection } from "./insert-section";
import { ScreenHeader } from "./screen-header";
import { SearchResults } from "./search-results";
import { SearchSection } from "./search-section";
import { SelectedEntityHeader } from "./selected-entity-header";
import { VariantGrid } from "./variant-grid";
import { VariantsSection } from "./variants-section";

export interface AssetSearchPanelViewProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchResultsId: string;
  assetLabel: string;
  label: string;
  headerText: string;
  searchPlaceholder: string;
  noResultsDescription: string;
  noVariantsDescription: string;
  icon: Icon;
  flow: ReturnType<typeof useAssetSearchFlow>;
  showsSearchResults: boolean;
  activeSearchResultId?: string;
  insertLabel: string;
  insertingLabel: string;
  insertDisabled: boolean;
  isInserting: boolean;
  onInsert: () => void | Promise<void>;
  focusSearchShortcutKeys: KeyToken[];
  searchNavigationShortcutDefs: ShortcutDef[];
  variantNavigationShortcutDefs: ShortcutDef[];
  insertSectionShortcutDefs: ShortcutDef[];
}

export function AssetSearchPanelView({
  searchInputRef,
  searchResultsId,
  assetLabel,
  label,
  headerText,
  searchPlaceholder,
  noResultsDescription,
  noVariantsDescription,
  icon: Icon,
  flow,
  showsSearchResults,
  activeSearchResultId,
  insertLabel,
  insertingLabel,
  insertDisabled,
  isInserting,
  onInsert,
  focusSearchShortcutKeys,
  searchNavigationShortcutDefs,
  variantNavigationShortcutDefs,
  insertSectionShortcutDefs,
}: AssetSearchPanelViewProps) {
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
          shortcutDefs={searchNavigationShortcutDefs}
          searchRightSlot={
            <ShortcutKeys tokens={focusSearchShortcutKeys} className="opacity-70" />
          }
        >
          {!flow.selectedEntity ? (
            flow.searchError ? (
              <ErrorState
                title={`Could not search for ${label}s`}
                description={flow.searchError}
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
                description={flow.variantsError}
                onRetry={flow.retryVariants}
              />
            ) : flow.variants.length > 0 ? (
              <VariantsSection shortcutDefs={variantNavigationShortcutDefs}>
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
              disabled={insertDisabled}
              isInserting={isInserting}
              label={insertLabel}
              insertingLabel={insertingLabel}
              shortcutDefs={insertSectionShortcutDefs}
              onClick={onInsert}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
