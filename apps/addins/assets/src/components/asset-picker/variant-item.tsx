import { Button } from "@deck-pack/ui/components/system/button";

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
    <Button
      type="button"
      variant={isSelected ? "default" : isHighlighted ? "secondary" : "ghost"}
      className={`h-auto w-full p-2 ${isHighlighted && !isSelected ? "ring-2 ring-primary/40" : ""}`}
      onClick={() => onSelect(variant.id)}
    >
      {variant.imageUrl ? (
        <img
          src={variant.imageUrl}
          alt={variant.name}
          className="h-16 w-16 rounded object-contain"
        />
      ) : (
        <div className="h-16 w-16 rounded bg-muted" />
      )}
    </Button>
  );
}
