import { useEffect, useState } from "react";

import type { AssetListItem } from "@/lib/asset-types";

export function useAssetSearch(
  debouncedQuery: string,
  searchFn: (query: string) => Promise<AssetListItem[]>,
) {
  const query = debouncedQuery.trim();
  const [results, setResults] = useState<AssetListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    async function performSearch() {
      setIsSearching(true);
      setHasSearched(true);
      setError(null);

      try {
        const items = await searchFn(query);

        if (cancelled) return;

        setResults(items);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Error searching");
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void performSearch();

    return () => {
      cancelled = true;
    };
  }, [query, searchFn]);

  return {
    results: query ? results : [],
    isSearching: query ? isSearching : false,
    hasSearched: query ? hasSearched : false,
    error: query ? error : null,
    clearResults: () => {
      setResults([]);
      setHasSearched(false);
      setError(null);
    },
  };
}
