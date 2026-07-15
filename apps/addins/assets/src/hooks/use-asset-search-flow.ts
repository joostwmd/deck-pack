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

  const {
    results,
    isSearching,
    hasSearched,
    error: searchError,
    retry: retrySearch,
  } = useAssetSearch(debouncedQuery, stableSearch);
  const {
    variants,
    details,
    isLoading: isFetchingVariants,
    error: variantsError,
    loadVariants,
    reset: resetVariants,
  } = useAssetVariants(stableGetDetails);

  const [selectedEntity, setSelectedEntity] = useState<SelectedAssetEntity | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectionQuery, setSelectionQuery] = useState("");
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const [highlightedVariantIndex, setHighlightedVariantIndex] = useState(0);

  const activeEntity = selectionQuery === query ? selectedEntity : null;
  const activeVariantId = selectionQuery === query ? selectedVariantId : null;
  const activeHighlightedResultIndex =
    results.length > 0 ? Math.min(highlightedResultIndex, results.length - 1) : -1;
  const activeHighlightedVariantIndex =
    variants.length > 0 ? Math.min(highlightedVariantIndex, variants.length - 1) : -1;

  const updateSearchValue = useCallback((value: string) => {
    setSearchValue(value);
    setHighlightedResultIndex(0);
  }, []);

  const selectEntity = useCallback(
    async (id: string) => {
      const entity = results.find((result) => result.id === id);
      if (!entity) return;

      // Align searchValue with the current debounced query so any pending debounce
      // timer is cancelled. Without this, a debounce firing after selection would
      // change `query`, making `selectionQuery !== query` and clearing the selection.
      setSearchValue(query);
      setSelectionQuery(query);
      setSelectedEntity({ id: entity.id, name: entity.name, icon: entity.imageUrl });
      setSelectedVariantId(null);
      setHighlightedVariantIndex(0);
      await loadVariants(id);
    },
    [results, loadVariants, query],
  );

  const navigateResults = useCallback(
    (direction: "up" | "down") => {
      if (results.length === 0) return;

      setHighlightedResultIndex((current) => {
        const start = Math.min(Math.max(current, 0), results.length - 1);

        if (direction === "down") {
          return Math.min(start + 1, results.length - 1);
        }

        return Math.max(start - 1, 0);
      });
    },
    [results.length],
  );

  const selectHighlightedResult = useCallback(() => {
    if (results.length === 0) return;

    const index = activeHighlightedResultIndex >= 0 ? activeHighlightedResultIndex : 0;
    const result = results[index];

    if (result) {
      void selectEntity(result.id);
    }
  }, [activeHighlightedResultIndex, results, selectEntity]);

  const navigateVariants = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (variants.length === 0) return;

      setHighlightedVariantIndex((current) => {
        const start = Math.min(Math.max(current, 0), variants.length - 1);
        const columnCount = 2;
        const column = start % columnCount;

        if (direction === "up") {
          return Math.max(start - columnCount, 0);
        }

        if (direction === "down") {
          const target = start + columnCount;
          return target < variants.length ? target : start;
        }

        if (direction === "right") {
          return column < columnCount - 1 ? Math.min(start + 1, variants.length - 1) : start;
        }

        return column > 0 ? start - 1 : start;
      });
    },
    [variants.length],
  );

  const confirmHighlightedVariant = useCallback(() => {
    if (variants.length === 0) return;

    const index = activeHighlightedVariantIndex >= 0 ? activeHighlightedVariantIndex : 0;
    const variant = variants[index];

    if (variant) {
      setSelectedVariantId(variant.id);
    }
  }, [activeHighlightedVariantIndex, variants]);

  const selectVariant = useCallback(
    (id: string) => {
      const index = variants.findIndex((variant) => variant.id === id);

      if (index >= 0) {
        setHighlightedVariantIndex(index);
      }

      setSelectedVariantId(id);
    },
    [variants],
  );

  const retryVariants = useCallback(() => {
    if (!activeEntity) return;
    return loadVariants(activeEntity.id);
  }, [activeEntity, loadVariants]);

  const goBack = useCallback(() => {
    if (activeVariantId) {
      setSelectedVariantId(null);
      return;
    }

    if (activeEntity) {
      resetVariants();
      setSelectedEntity(null);
      setSelectionQuery("");
      setHighlightedResultIndex(0);
      return;
    }

    if (searchValue) {
      setSearchValue("");
    }
  }, [activeEntity, activeVariantId, resetVariants, searchValue]);

  const highlightedResultId =
    activeHighlightedResultIndex >= 0 ? (results[activeHighlightedResultIndex]?.id ?? null) : null;
  const highlightedVariantId =
    activeHighlightedVariantIndex >= 0
      ? (variants[activeHighlightedVariantIndex]?.id ?? null)
      : null;

  return {
    searchValue,
    setSearchValue: updateSearchValue,
    results,
    isSearching,
    hasSearched,
    searchError,
    retrySearch,
    variants,
    details: activeEntity ? details : null,
    isFetchingVariants,
    variantsError,
    retryVariants,
    selectedEntity: activeEntity,
    selectedVariantId: activeVariantId,
    highlightedResultId,
    highlightedVariantId,
    selectEntity,
    selectVariant,
    navigateResults,
    selectHighlightedResult,
    navigateVariants,
    confirmHighlightedVariant,
    goBack,
  };
}
