import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ShapeSearchFacets,
  ShapeSearchRequest,
  ShapeSearchResponse,
  ShapeSearchResult,
} from "@/components/shapes/types";
import { getUserFacingApiErrorMessage } from "@/lib/user-facing-api-error";

const EMPTY_FACETS: ShapeSearchFacets = {
  categories: [],
};

export function useShapeLibrary(
  searchFn: (input: ShapeSearchRequest) => Promise<ShapeSearchResponse>,
) {
  const searchRef = useRef(searchFn);
  searchRef.current = searchFn;

  const [category, setCategory] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<ShapeSearchResult[]>([]);
  const [facets, setFacets] = useState<ShapeSearchFacets>(EMPTY_FACETS);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const updateCategory = useCallback((next: string | undefined) => {
    setCategory(next);
    setSelectedId(null);
    setHighlightedIndex(0);
  }, []);

  const retry = useCallback(() => {
    setRetryAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchShapes() {
      setIsLoading(true);
      setHasLoaded(true);
      setError(null);

      try {
        const response = await searchRef.current({
          category,
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
        setError(getUserFacingApiErrorMessage(err, "Error loading shapes"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchShapes();

    return () => {
      cancelled = true;
    };
  }, [category, retryAttempt]);

  const selectShape = useCallback(
    (id: string) => {
      const index = results.findIndex((result) => result.id === id);

      if (index >= 0) {
        setHighlightedIndex(index);
      }

      setSelectedId(id);
    },
    [results],
  );

  const navigateShapes = useCallback(
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

  const confirmHighlightedShape = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    const index = highlightedIndex >= 0 ? highlightedIndex : 0;
    const shape = results[index];

    if (shape) {
      setSelectedId(shape.id);
    }
  }, [highlightedIndex, results]);

  const highlightedShapeId =
    highlightedIndex >= 0 ? (results[highlightedIndex]?.id ?? null) : null;
  const selectedShape = results.find((result) => result.id === selectedId) ?? null;

  return {
    category,
    updateCategory,
    results,
    facets,
    total,
    isLoading,
    error,
    hasLoaded,
    retry,
    selectedId,
    selectedShape,
    highlightedShapeId,
    highlightedIndex,
    selectShape,
    navigateShapes,
    confirmHighlightedShape,
  };
}
