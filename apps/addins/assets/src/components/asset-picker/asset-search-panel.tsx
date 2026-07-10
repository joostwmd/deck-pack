import { Loader2, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ShortcutKeys } from "@/components/shortcut-hint";
import { useWebCanvasOptional } from "@/contexts/web-canvas-context";
import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { useAssetSearchHotkeys } from "@/hooks/use-asset-search-hotkeys";
import type { AssetDetailsResponse, AssetListItem, AssetPanelMode } from "@/lib/asset-types";
import { SHORTCUTS } from "@/lib/shortcuts";

import { EmptyState } from "./empty-state";
import { InsertButton } from "./insert-button";
import { ScreenHeader } from "./screen-header";
import { SearchResults } from "./search-results";
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
  /** Singular, capitalized noun used to derive titles and messages, e.g. "Logo". */
  assetLabel: string;
  headerText: string;
  searchPlaceholder: string;
  icon: LucideIcon;
  noResultsDescription: string;
  noVariantsDescription: string;
  search: (query: string) => Promise<AssetListItem[]>;
  getDetails: (id: string) => Promise<AssetDetailsResponse>;
  onInsert: (context: InsertContext) => Promise<void>;
}

export function AssetSearchPanel({
  mode,
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
  const [isInserting, setIsInserting] = useState(false);

  const label = assetLabel.toLowerCase();

  const handleInsert = useCallback(async () => {
    if (!flow.selectedEntity || !flow.selectedVariantId || !flow.details) return;

    if (mode === "web") {
      const variant = flow.details.variants.find((item) => item.id === flow.selectedVariantId);

      if (!variant) {
        toast.error("Variant not found");
        return;
      }

      if (!webCanvas) {
        toast.error("Canvas not available");
        return;
      }

      setIsInserting(true);

      try {
        webCanvas.addToCanvas({
          id: variant.id,
          name: flow.details.name,
          imageUrl: variant.imageUrl,
          insert: variant.insert,
          metadata: flow.details.metadata,
        });

        toast.success(`${assetLabel} added to canvas`);
      } catch (error) {
        console.error(`Error adding ${label} to canvas:`, error);
        toast.error(error instanceof Error ? error.message : `Error adding ${label} to canvas`);
      } finally {
        setIsInserting(false);
      }

      return;
    }

    setIsInserting(true);

    try {
      await onInsert({
        details: flow.details,
        variantId: flow.selectedVariantId,
      });

      toast.success(`${assetLabel} inserted`);
    } catch (error) {
      console.error(`Error inserting ${label}:`, error);
      toast.error(error instanceof Error ? error.message : `Error inserting ${label}`);
    } finally {
      setIsInserting(false);
    }
  }, [
    assetLabel,
    flow.details,
    flow.selectedEntity,
    flow.selectedVariantId,
    label,
    mode,
    onInsert,
    webCanvas,
  ]);

  useAssetSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
  });

  useEffect(() => {
    if (flow.searchError) toast.error(`Error searching for ${label}s`);
  }, [flow.searchError, label]);

  useEffect(() => {
    if (flow.variantsError) toast.error(`Error fetching ${label} variants`);
  }, [flow.variantsError, label]);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title={`${assetLabel}s`} text={headerText} />

      <div className="px-4 pt-4">
        <SearchSection
          searchRef={searchInputRef}
          value={flow.searchValue}
          onChange={flow.setSearchValue}
          isSearching={flow.isSearching}
          placeholder={searchPlaceholder}
          searchRightSlot={<ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} className="opacity-70" />}
        >
          {flow.results.length > 0 ? (
            <SearchResults
              results={flow.results}
              highlightedId={flow.highlightedResultId}
              selectedId={flow.selectedEntity?.id}
              onSelect={(id) => void flow.selectEntity(id)}
            />
          ) : flow.hasSearched && !flow.isSearching ? (
            <EmptyState icon={Icon} title={`No ${label}s found`} description={noResultsDescription} />
          ) : null}
        </SearchSection>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {flow.selectedEntity ? (
          <div className="mt-6 flex flex-col gap-6">
            <SelectedEntityHeader entity={flow.selectedEntity} />

            {flow.isFetchingVariants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin" />
              </div>
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

            <InsertButton
              disabled={!flow.selectedVariantId}
              isInserting={isInserting}
              label={mode === "web" ? "Add to canvas" : "Insert"}
              insertingLabel={mode === "web" ? "Adding..." : "Inserting..."}
              showShortcut={!isInserting && !!flow.selectedVariantId}
              onClick={handleInsert}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
