import { useEffect, useState } from "react";

import { addinApi } from "@/lib/api";

export interface LogoListItem {
  id: string;
  imageUrl: string;
  name: string;
}

export function useLogoSearch(debouncedQuery: string) {
  const [results, setResults] = useState<LogoListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = debouncedQuery.trim();

    if (!query) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function performSearch() {
      setIsSearching(true);
      setHasSearched(true);
      setError(null);

      try {
        const brands = await addinApi.searchLogos(query);

        if (cancelled) return;

        const mapped = (Array.isArray(brands) ? brands : []).map((logo: any) => ({
          id: logo.brandId,
          imageUrl: logo.icon || "",
          name: logo.name || logo.domain,
        }));

        setResults(mapped);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Error searching for logos");
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
  }, [debouncedQuery]);

  return {
    results,
    isSearching,
    hasSearched,
    error,
    clearResults: () => {
      setResults([]);
      setHasSearched(false);
      setError(null);
    },
  };
}
