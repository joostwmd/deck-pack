import { Button } from "@deck-pack/ui/components/system/button";

import type { AssetListItem } from "@/lib/asset-types";

interface VariantItemProps {
  variant: AssetListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function VariantItem({ variant, isSelected, onSelect }: VariantItemProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "ghost"}
      className="h-auto w-full p-2"
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
