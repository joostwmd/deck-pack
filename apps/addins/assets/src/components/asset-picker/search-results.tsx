import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef } from "react";

import type { AssetListItem } from "@/lib/asset-types";

import { SearchResultItem } from "./search-result-item";

interface SearchResultsProps {
  id: string;
  results: AssetListItem[];
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function getSearchResultOptionId(listboxId: string, resultId: string) {
  return `${listboxId}-option-${encodeURIComponent(resultId)}`;
}

export function SearchResults({
  id,
  results,
  highlightedId = null,
  onSelect,
  className,
}: SearchResultsProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resultsRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedId]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div
      id={id}
      ref={resultsRef}
      role="listbox"
      aria-label="Search results"
      className={cn(
        "flex max-h-[min(22rem,50vh)] w-full flex-col divide-y divide-border/60 overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {results.map((result) => {
        const isHighlighted = highlightedId === result.id;

        return (
          <button
            key={result.id}
            id={getSearchResultOptionId(id, result.id)}
            type="button"
            role="option"
            aria-selected={isHighlighted}
            tabIndex={isHighlighted ? 0 : -1}
            data-highlighted={isHighlighted || undefined}
            className={cn(
              "w-full cursor-pointer rounded-sm px-1.5 py-2 text-start transition-colors duration-150 hover:bg-muted/60 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary motion-reduce:transition-none",
              isHighlighted && "bg-primary/10 outline-2 outline-offset-[-2px] outline-primary",
            )}
            onClick={() => onSelect?.(result.id)}
          >
            <SearchResultItem result={result} />
          </button>
        );
      })}
    </div>
  );
}
