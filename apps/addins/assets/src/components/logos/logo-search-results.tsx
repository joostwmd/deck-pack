import type { LogoListItem } from "@/hooks/use-logo-search";

import { LogoSearchResultItem } from "./logo-search-result-item";

interface LogoSearchResultsProps {
  results: LogoListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function LogoSearchResults({ results, selectedId = null, onSelect }: LogoSearchResultsProps) {
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
          <LogoSearchResultItem result={result} isSelected={selectedId === result.id} />
        </button>
      ))}
    </div>
  );
}
