import { cn } from "@deck-pack/ui/lib/utils";

import type { AssetListItem } from "@/lib/asset-types";

import { SearchResultItem } from "./search-result-item";

interface SearchResultsProps {
  results: AssetListItem[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function SearchResults({
  results,
  highlightedId = null,
  selectedId = null,
  onSelect,
  className,
}: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex w-full flex-col overflow-hidden rounded-lg border border-border", className)}>
      {results.map((result, index) => {
        const isHighlighted = highlightedId === result.id;
        const isSelected = selectedId === result.id;
        const isActive = isHighlighted || isSelected;

        return (
          <button
            key={result.id}
            type="button"
            className={cn(
              "w-full cursor-pointer border-b border-border bg-secondary p-2 text-left transition-colors last:border-b-0 hover:bg-secondary/80",
              index === 0 && "rounded-t-lg",
              index === results.length - 1 && "rounded-b-lg",
              isActive && "bg-background shadow-xs ring-1 ring-inset ring-primary/15",
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
