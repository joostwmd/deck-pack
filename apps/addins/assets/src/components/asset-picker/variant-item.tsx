import { cn } from "@deck-pack/ui/lib/utils";
import { CheckCircle } from "@phosphor-icons/react";

import type { AssetListItem } from "@/lib/asset-types";

interface VariantItemProps {
  variant: AssetListItem;
  isHighlighted?: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function VariantItem({
  variant,
  isHighlighted = false,
  isSelected,
  onSelect,
}: VariantItemProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      tabIndex={isHighlighted ? 0 : -1}
      data-highlighted={isHighlighted || undefined}
      className={cn(
        "flex min-w-0 w-full flex-col items-center rounded-md p-1.5 text-start transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
        isSelected && "bg-primary/10 text-primary",
        isHighlighted && "outline-2 outline-offset-2 outline-primary",
      )}
      onClick={() => onSelect(variant.id)}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted/60 p-2">
          <div className="absolute inset-2 rounded-sm bg-muted" aria-hidden />
          {variant.imageUrl ? (
            <img
              src={variant.imageUrl}
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

        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-foreground"
            title={variant.name}
          >
            {variant.name}
          </p>
          {isSelected ? (
            <CheckCircle weight="fill" className="size-4 shrink-0 text-primary" aria-hidden />
          ) : null}
        </div>
      </div>
    </button>
  );
}
