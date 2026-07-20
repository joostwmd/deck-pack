import { useCallback, useId, useRef } from "react";
import type { Icon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import { useAssetInsertion } from "@/hooks/use-asset-insertion";
import { useAssetSearchHotkeys } from "@/hooks/use-asset-search-hotkeys";
import { useInsertionStrategy } from "@/hooks/use-insertion-strategy";
import {
  useInsertSectionShortcutDefs,
  useResolvedShortcutDef,
  useSearchNavigationShortcutDefs,
  useVariantNavigationShortcutDefs,
} from "@/hooks/use-resolved-shortcut-defs";
import type { AssetDetailsResponse, AssetListItem, AssetType } from "@/types/asset-types";

import { getSearchResultOptionId } from "@/components/asset-browser/search-results";
import type { AssetSearchPanelViewProps } from "@/components/asset-browser/asset-search-panel-view";

export interface AssetSearchPanelProps {
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
  getInsertionMetadata?: (details: AssetDetailsResponse, variantId: string) => Record<string, string>;
  supportsInternalFilter?: boolean;
}

export function useAssetSearchPanelController({
  assetType,
  assetLabel,
  headerText,
  searchPlaceholder,
  icon,
  noResultsDescription,
  noVariantsDescription,
  search,
  getDetails,
  getInsertionMetadata,
  supportsInternalFilter = false,
}: AssetSearchPanelProps): AssetSearchPanelViewProps {
  const flow = useAssetSearchFlow({ search, getDetails, supportsInternalFilter });
  const insertionStrategy = useInsertionStrategy();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsId = useId();
  const { isInserting, runInsertion } = useAssetInsertion();
  const focusSearchShortcut = useResolvedShortcutDef("focusSearch");
  const searchNavigationShortcutDefs = useSearchNavigationShortcutDefs();
  const variantNavigationShortcutDefs = useVariantNavigationShortcutDefs();
  const insertSectionShortcutDefs = useInsertSectionShortcutDefs();

  const label = assetLabel.toLowerCase();
  const showsSearchResults = !flow.selectedEntity && !flow.searchError && flow.results.length > 0;
  const activeSearchResultId =
    showsSearchResults && flow.highlightedResultId
      ? getSearchResultOptionId(searchResultsId, flow.highlightedResultId)
      : undefined;

  const handleInsert = useCallback(async () => {
    if (!flow.selectedEntity || !flow.selectedVariantId || !flow.details || !insertionStrategy) {
      return;
    }

    const variant = flow.details.variants.find((item) => item.id === flow.selectedVariantId);

    if (!variant) {
      toast.error("Variant not found");
      return;
    }

    await runInsertion(async () => {
      await insertionStrategy.insert({
        variantId: variant.id,
        name: flow.details!.name,
        imageUrl: variant.imageUrl,
        insert: variant.insert,
        metadata: {
          ...flow.details!.metadata,
          variantId: variant.id,
          ...getInsertionMetadata?.(flow.details!, variant.id),
        },
        assetType,
        externalId: flow.details!.id,
      });

      toast.success(
        insertionStrategy.verb === "Insert"
          ? `${assetLabel} inserted`
          : `${assetLabel} added to canvas`,
      );
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
    getInsertionMetadata,
    insertionStrategy,
    label,
    runInsertion,
  ]);

  useAssetSearchHotkeys({
    searchInputRef,
    flow,
    onInsert: handleInsert,
    isInserting,
  });

  const insertLabel = insertionStrategy?.verb ?? "Insert";
  const insertingLabel = insertionStrategy?.insertingVerb ?? "Inserting...";

  return {
    searchInputRef,
    searchResultsId,
    assetLabel,
    label,
    headerText,
    searchPlaceholder,
    noResultsDescription,
    noVariantsDescription,
    icon,
    flow,
    showsSearchResults,
    activeSearchResultId,
    insertLabel,
    insertingLabel,
    insertDisabled: !flow.selectedVariantId || !insertionStrategy,
    isInserting,
    onInsert: handleInsert,
    focusSearchShortcutKeys: focusSearchShortcut.keys,
    searchNavigationShortcutDefs,
    variantNavigationShortcutDefs,
    insertSectionShortcutDefs,
  };
}
