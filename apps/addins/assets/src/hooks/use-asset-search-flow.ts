import { useCallback, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { AssetDetailsResponse, AssetListItem, SelectedAssetEntity } from "@/lib/asset-types";

import { useAssetSearch } from "./use-asset-search";
import { useAssetVariants } from "./use-asset-variants";

export interface UseAssetSearchFlowConfig {
  search: (query: string) => Promise<AssetListItem[]>;
  getDetails: (id: string) => Promise<AssetDetailsResponse>;
}

/**
 * Drives the shared search -> select -> variants -> select workflow.
 * API responses are already normalized by the backend.
 */
export function useAssetSearchFlow({ search, getDetails }: UseAssetSearchFlowConfig) {
  const searchRef = useRef(search);
  searchRef.current = search;
  const getDetailsRef = useRef(getDetails);
  getDetailsRef.current = getDetails;

  const stableSearch = useCallback((query: string) => searchRef.current(query), []);
  const stableGetDetails = useCallback(async (id: string) => {
    const details = await getDetailsRef.current(id);
    return { variants: details.variants, details };
  }, []);

  const [searchValue, setSearchValue] = useState("");
  const debouncedQuery = useDebouncedValue(searchValue, 500);
  const query = debouncedQuery.trim();

  const { results, isSearching, hasSearched, error: searchError } = useAssetSearch(
    debouncedQuery,
    stableSearch,
  );
  const {
    variants,
    details,
    isLoading: isFetchingVariants,
    error: variantsError,
    loadVariants,
  } = useAssetVariants(stableGetDetails);

  const [selectedEntity, setSelectedEntity] = useState<SelectedAssetEntity | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectionQuery, setSelectionQuery] = useState("");

  const activeEntity = selectionQuery === query ? selectedEntity : null;
  const activeVariantId = selectionQuery === query ? selectedVariantId : null;

  const selectEntity = useCallback(
    async (id: string) => {
      const entity = results.find((result) => result.id === id);
      if (!entity) return;

      setSelectionQuery(query);
      setSelectedEntity({ id: entity.id, name: entity.name, icon: entity.imageUrl });
      setSelectedVariantId(null);
      await loadVariants(id);
    },
    [results, loadVariants, query],
  );

  return {
    searchValue,
    setSearchValue,
    results,
    isSearching,
    hasSearched,
    searchError,
    variants,
    details: activeEntity ? details : null,
    isFetchingVariants,
    variantsError,
    selectedEntity: activeEntity,
    selectedVariantId: activeVariantId,
    selectEntity,
    selectVariant: setSelectedVariantId,
  };
}
