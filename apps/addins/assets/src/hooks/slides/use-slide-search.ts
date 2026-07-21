import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";

import type {
  SlideFilters,
  SlideSearchFacets,
  SlideSearchRequest,
  SlideSearchResponse,
  SlideSearchResult,
  SlideSort,
} from "@/components/slides/types";

const EMPTY_FACETS: SlideSearchFacets = {
  categories: [],
  tags: [],
  aspectRatios: [],
};

export function useSlideSearch(
  searchFn: (input: SlideSearchRequest) => Promise<SlideSearchResponse>,
) {
  const searchRef = useRef(searchFn);
  searchRef.current = searchFn;

  const [queryInput, setQueryInput] = useState("");
  const debouncedQuery = useDebouncedValue(queryInput, 500);
  const normalizedQuery = debouncedQuery.trim();
  const [filters, setFilters] = useState<SlideFilters>({});
  const [sort, setSort] = useState<SlideSort>("relevance");
  const [results, setResults] = useState<SlideSearchResult[]>([]);
  const [facets, setFacets] = useState<SlideSearchFacets>(EMPTY_FACETS);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const updateFilters = useCallback((next: SlideFilters) => {
    setFilters(next);
    setSelectedId(null);
    setHighlightedIndex(0);
  }, []);

  const updateSort = useCallback((next: SlideSort) => {
    setSort(next);
    setSelectedId(null);
    setHighlightedIndex(0);
  }, []);

  const retry = useCallback(() => {
    setRetryAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchSlides() {
      setIsSearching(true);
      setHasLoaded(true);
      setError(null);

      try {
        const response = await searchRef.current({
          query: normalizedQuery || undefined,
          filters,
          sort,
        });

        if (cancelled) {
          return;
        }

        setResults(response.results);
        setFacets(response.facets);
        setTotal(response.total);
        setHighlightedIndex(response.results.length > 0 ? 0 : -1);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setResults([]);
        setTotal(0);
        setError(getUserFacingApiErrorMessage(err, "Error searching slides"));
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void fetchSlides();

    return () => {
      cancelled = true;
    };
  }, [normalizedQuery, filters, sort, retryAttempt]);

  const selectSlide = useCallback(
    (id: string) => {
      const index = results.findIndex((result) => result.id === id);

      if (index >= 0) {
        setHighlightedIndex(index);
      }

      setSelectedId(id);
    },
    [results],
  );

  const navigateSlides = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (results.length === 0) {
        return;
      }

      const columnCount = 2;

      setHighlightedIndex((current) => {
        const start = Math.min(Math.max(current, 0), results.length - 1);
        const column = start % columnCount;

        if (direction === "up") {
          return Math.max(start - columnCount, 0);
        }

        if (direction === "down") {
          const target = start + columnCount;
          return target < results.length ? target : start;
        }

        if (direction === "right") {
          return column < columnCount - 1 ? Math.min(start + 1, results.length - 1) : start;
        }

        return column > 0 ? start - 1 : start;
      });
    },
    [results.length],
  );

  const confirmHighlightedSlide = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    const index = highlightedIndex >= 0 ? highlightedIndex : 0;
    const slide = results[index];

    if (slide) {
      setSelectedId(slide.id);
    }
  }, [highlightedIndex, results]);

  const highlightedSlideId = highlightedIndex >= 0 ? (results[highlightedIndex]?.id ?? null) : null;
  const selectedSlide = results.find((result) => result.id === selectedId) ?? null;
  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.aspectRatio ? 1 : 0) +
    (filters.tags?.length ?? 0) +
    (filters.internalOnly ? 1 : 0);

  return {
    queryInput,
    setQueryInput,
    normalizedQuery,
    filters,
    updateFilters,
    sort,
    updateSort,
    results,
    facets,
    total,
    isSearching,
    error,
    hasLoaded,
    retry,
    selectedId,
    selectedSlide,
    highlightedSlideId,
    highlightedIndex,
    selectSlide,
    navigateSlides,
    confirmHighlightedSlide,
    activeFilterCount,
  };
}
