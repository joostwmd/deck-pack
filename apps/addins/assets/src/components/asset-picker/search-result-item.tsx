import type { AssetListItem } from "@/lib/asset-types";

interface SearchResultItemProps {
  result: AssetListItem;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60 p-1.5">
        <div className="absolute inset-1.5 rounded-sm bg-muted" aria-hidden />
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative size-full object-contain"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
      </div>

      <p
        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        title={result.name}
      >
        {result.name}
      </p>
    </div>
  );
}
