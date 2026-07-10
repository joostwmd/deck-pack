import { cn } from "@deck-pack/ui/lib/utils";

import type { AssetListItem } from "@/lib/asset-types";

interface SearchResultItemProps {
  result: AssetListItem;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border bg-background p-1 shadow-md">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={result.name} className="size-full object-contain" />
        ) : (
          <div className="size-full rounded-sm bg-muted" />
        )}
      </div>

      <p className="text-base font-medium text-foreground">{result.name}</p>
    </div>
  );
}
