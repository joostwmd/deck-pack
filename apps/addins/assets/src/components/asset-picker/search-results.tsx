import type { AssetListItem } from "@/lib/asset-types";

import { SearchResultItem } from "./search-result-item";

interface SearchResultsProps {
  results: AssetListItem[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function SearchResults({
  results,
  highlightedId = null,
  selectedId = null,
  onSelect,
}: SearchResultsProps) {
  return (
    <div className="divide-y border">
      {results.map((result) => {
        const isHighlighted = highlightedId === result.id;
        const isSelected = selectedId === result.id;

        return (
          <button
            key={result.id}
            type="button"
            className={`w-full cursor-pointer p-2 text-left transition-colors hover:bg-muted/50 ${
              isHighlighted ? "bg-primary/10 ring-1 ring-primary/30 ring-inset" : ""
            } ${isSelected ? "bg-muted" : ""}`}
            onClick={() => onSelect?.(result.id)}
          >
            <SearchResultItem result={result} isSelected={isHighlighted || isSelected} />
          </button>
        );
      })}
    </div>
  );
}
