import { Loader2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import type { AssetDetailsResponse, AssetListItem, AssetPanelMode } from "@/lib/asset-types";

import { EmptyState } from "./empty-state";
import { InsertButton } from "./insert-button";
import { ScreenHeader } from "./screen-header";
import { SearchBar } from "./search-bar";
import { SearchResults } from "./search-results";
import { SelectedEntityHeader } from "./selected-entity-header";
import { VariantGrid } from "./variant-grid";

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
  const [isInserting, setIsInserting] = useState(false);

  const label = assetLabel.toLowerCase();

  useEffect(() => {
    if (flow.searchError) toast.error(`Error searching for ${label}s`);
  }, [flow.searchError, label]);

  useEffect(() => {
    if (flow.variantsError) toast.error(`Error fetching ${label} variants`);
  }, [flow.variantsError, label]);

  async function handleInsert() {
    if (!flow.selectedEntity || !flow.selectedVariantId || !flow.details) return;

    if (mode === "web") {
      toast.info("Canvas coming soon", {
        description: `${assetLabel} will be addable to the slide canvas in a future update.`,
      });
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
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title={`${assetLabel}s`} text={headerText} />

      <div className="px-4 pt-4">
        <SearchBar
          value={flow.searchValue}
          onChange={flow.setSearchValue}
          isSearching={flow.isSearching}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="mt-4 flex flex-1 flex-col px-4 pb-4">
        {flow.results.length > 0 ? (
          <SearchResults
            results={flow.results}
            selectedId={flow.selectedEntity?.id}
            onSelect={(id) => void flow.selectEntity(id)}
          />
        ) : flow.hasSearched && !flow.isSearching ? (
          <EmptyState icon={Icon} title={`No ${label}s found`} description={noResultsDescription} />
        ) : null}

        {flow.selectedEntity ? (
          <div className="mt-4 border-t pt-4">
            <SelectedEntityHeader entity={flow.selectedEntity} />

            <div className="mt-4">
              {flow.isFetchingVariants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin" />
                </div>
              ) : flow.variants.length > 0 ? (
                <VariantGrid
                  variants={flow.variants}
                  selectedId={flow.selectedVariantId}
                  onSelect={flow.selectVariant}
                />
              ) : (
                <EmptyState
                  icon={Icon}
                  title="No variants available"
                  description={noVariantsDescription}
                />
              )}
            </div>

            <InsertButton
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
