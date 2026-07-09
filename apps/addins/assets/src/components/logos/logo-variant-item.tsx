import { Button } from "@deck-pack/ui/components/system/button";

import type { LogoListItem } from "@/hooks/use-logo-search";

interface LogoVariantItemProps {
  variant: LogoListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function LogoVariantItem({ variant, isSelected, onSelect }: LogoVariantItemProps) {
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
