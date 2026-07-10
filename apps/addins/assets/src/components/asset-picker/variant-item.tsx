import { cn } from "@deck-pack/ui/lib/utils";

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
  const isActive = isHighlighted || isSelected;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col items-center rounded-lg border border-border p-2 shadow-sm transition-colors",
        isSelected ? "bg-[#1ba60b]" : "bg-card",
        isActive && !isSelected && "ring-1 ring-inset ring-primary/20",
      )}
      onClick={() => onSelect(variant.id)}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex aspect-square w-full items-center justify-center rounded-sm border border-border bg-background p-1 shadow-md">
          {variant.imageUrl ? (
            <img src={variant.imageUrl} alt={variant.name} className="size-full object-contain" />
          ) : (
            <div className="size-full rounded-sm bg-muted" />
          )}
        </div>

        <p className="text-left text-sm font-semibold leading-[21px] tracking-[0.07px] text-foreground">
          {variant.name}
        </p>
      </div>
    </button>
  );
}
