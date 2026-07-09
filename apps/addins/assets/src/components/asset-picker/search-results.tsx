import type { AssetListItem } from "@/lib/asset-types";

import { SearchResultItem } from "./search-result-item";

interface SearchResultsProps {
  results: AssetListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function SearchResults({ results, selectedId = null, onSelect }: SearchResultsProps) {
  return (
    <div className="divide-y border">
      {results.map((result) => (
        <button
          key={result.id}
          type="button"
          className={`w-full cursor-pointer p-2 text-left transition-colors hover:bg-muted/50 ${
            selectedId === result.id ? "bg-muted" : ""
          }`}
          onClick={() => onSelect?.(result.id)}
        >
          <SearchResultItem result={result} isSelected={selectedId === result.id} />
        </button>
      ))}
    </div>
  );
}
