import { useCallback, useEffect, useRef, useState } from "react";

import { getUserFacingApiErrorMessage } from "@/utils/user-facing-api-error";

import type {
  PhotoFilters,
  PhotoSearchRequest,
  PhotoSearchResponse,
  PhotoSearchResult,
} from "@/components/photos/types";

function dedupeResults(results: PhotoSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }

    seen.add(result.id);
    return true;
  });
}

export function usePhotoSearch(
  searchFn: (input: PhotoSearchRequest) => Promise<PhotoSearchResponse>,
) {
  const searchRef = useRef(searchFn);
  searchRef.current = searchFn;

  const [queryInput, setQueryInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<PhotoFilters>({});
  const [results, setResults] = useState<PhotoSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const submitSearch = useCallback(() => {
    const query = queryInput.trim();

    if (!query) {
      return;
    }

    setSubmittedQuery(query);
    setPage(1);
    setSelectedId(null);
    setHighlightedIndex(0);
  }, [queryInput]);

  const updateFilters = useCallback((next: PhotoFilters) => {
    setFilters(next);
    setPage(1);
    setSelectedId(null);
    setHighlightedIndex(0);
  }, []);

  const retry = useCallback(() => {
    setRetryAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (!submittedQuery) {
      return;
    }

    let cancelled = false;

    async function fetchPageOne() {
      setIsSearching(true);
      setHasSearched(true);
      setError(null);

      try {
        const response = await searchRef.current({
          query: submittedQuery,
          page: 1,
          filters,
        });

        if (cancelled) {
          return;
        }

        setResults(response.results);
        setPage(response.page);
        setHasNextPage(response.hasNextPage);
        setTotalResults(response.totalResults);
        setHighlightedIndex(response.results.length > 0 ? 0 : -1);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setResults([]);
        setHasNextPage(false);
        setTotalResults(0);
        setError(getUserFacingApiErrorMessage(err, "Error searching photos"));
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void fetchPageOne();

    return () => {
      cancelled = true;
    };
  }, [submittedQuery, filters, retryAttempt]);

  const loadMore = useCallback(async () => {
    if (!submittedQuery || !hasNextPage || isLoadingMore || isSearching) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await searchRef.current({
        query: submittedQuery,
        page: nextPage,
        filters,
      });

      setResults((current) => dedupeResults([...current, ...response.results]));
      setPage(response.page);
      setHasNextPage(response.hasNextPage);
      setTotalResults(response.totalResults);
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, "Error loading more photos"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, hasNextPage, isLoadingMore, isSearching, page, submittedQuery]);

  const selectPhoto = useCallback(
    (id: string) => {
      const index = results.findIndex((result) => result.id === id);

      if (index >= 0) {
        setHighlightedIndex(index);
      }

      setSelectedId(id);
    },
    [results],
  );

  const navigatePhotos = useCallback(
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

  const confirmHighlightedPhoto = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    const index = highlightedIndex >= 0 ? highlightedIndex : 0;
    const photo = results[index];

    if (photo) {
      setSelectedId(photo.id);
    }
  }, [highlightedIndex, results]);

  const highlightedPhotoId = highlightedIndex >= 0 ? (results[highlightedIndex]?.id ?? null) : null;
  const selectedPhoto = results.find((result) => result.id === selectedId) ?? null;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    queryInput,
    setQueryInput,
    submittedQuery,
    filters,
    updateFilters,
    results,
    page,
    hasNextPage,
    totalResults,
    isSearching,
    isLoadingMore,
    error,
    hasSearched,
    retry,
    submitSearch,
    loadMore,
    selectedId,
    selectedPhoto,
    highlightedPhotoId,
    highlightedIndex,
    selectPhoto,
    navigatePhotos,
    confirmHighlightedPhoto,
    activeFilterCount,
  };
}
