import type { AssetListItem } from "@/lib/asset-types";

interface SearchResultItemProps {
  result: AssetListItem;
  isSelected?: boolean;
}

export function SearchResultItem({ result, isSelected = false }: SearchResultItemProps) {
  return (
    <div
      className={`flex w-full items-center gap-3 ${isSelected ? "opacity-100" : "opacity-90"}`}
    >
      {result.imageUrl ? (
        <img
          src={result.imageUrl}
          alt={result.name}
          className="h-10 w-10 rounded object-contain"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-muted" />
      )}
      <p className="font-medium">{result.name}</p>
    </div>
  );
}
