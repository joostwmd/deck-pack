import { useCallback, useEffect, useRef, useState } from "react";

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
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(-1);
  const [highlightedVariantIndex, setHighlightedVariantIndex] = useState(-1);

  const activeEntity = selectionQuery === query ? selectedEntity : null;
  const activeVariantId = selectionQuery === query ? selectedVariantId : null;

  useEffect(() => {
    if (results.length > 0) {
      setHighlightedResultIndex(0);
      return;
    }

    setHighlightedResultIndex(-1);
  }, [results]);

  useEffect(() => {
    if (variants.length === 0) {
      setHighlightedVariantIndex(-1);
      return;
    }

    if (activeVariantId) {
      const index = variants.findIndex((variant) => variant.id === activeVariantId);
      setHighlightedVariantIndex(index >= 0 ? index : 0);
      return;
    }

    setHighlightedVariantIndex(0);
  }, [variants, activeVariantId]);

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
      await loadVariants(id);
    },
    [results, loadVariants, query],
  );

  const navigateResults = useCallback(
    (direction: "up" | "down") => {
      if (results.length === 0) return;

      setHighlightedResultIndex((current) => {
        const start = current < 0 ? 0 : current;

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

    const index = highlightedResultIndex >= 0 ? highlightedResultIndex : 0;
    const result = results[index];

    if (result) {
      void selectEntity(result.id);
    }
  }, [highlightedResultIndex, results, selectEntity]);

  const navigateVariants = useCallback(
    (direction: "left" | "right") => {
      if (variants.length === 0) return;

      setHighlightedVariantIndex((current) => {
        const start = current < 0 ? 0 : current;

        if (direction === "right") {
          return Math.min(start + 1, variants.length - 1);
        }

        return Math.max(start - 1, 0);
      });
    },
    [variants.length],
  );

  const confirmHighlightedVariant = useCallback(() => {
    if (variants.length === 0) return;

    const index = highlightedVariantIndex >= 0 ? highlightedVariantIndex : 0;
    const variant = variants[index];

    if (variant) {
      setSelectedVariantId(variant.id);
    }
  }, [highlightedVariantIndex, variants]);

  const goBack = useCallback(() => {
    if (activeVariantId) {
      setSelectedVariantId(null);
      return;
    }

    if (activeEntity) {
      setSelectedEntity(null);
      setSelectionQuery("");
      setHighlightedResultIndex(results.length > 0 ? 0 : -1);
      return;
    }

    if (searchValue) {
      setSearchValue("");
    }
  }, [activeEntity, activeVariantId, results.length, searchValue]);

  const highlightedResultId =
    highlightedResultIndex >= 0 ? (results[highlightedResultIndex]?.id ?? null) : null;
  const highlightedVariantId =
    highlightedVariantIndex >= 0 ? (variants[highlightedVariantIndex]?.id ?? null) : null;

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
    highlightedResultId,
    highlightedVariantId,
    selectEntity,
    selectVariant: setSelectedVariantId,
    navigateResults,
    selectHighlightedResult,
    navigateVariants,
    confirmHighlightedVariant,
    goBack,
  };
}
