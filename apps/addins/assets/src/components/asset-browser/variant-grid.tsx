import { cn } from "@deck-pack/ui/lib/utils";

import type { AssetListItem } from "@/types/asset-types";

import { SelectableGrid } from "./selectable-grid";
import { VariantItem } from "./variant-item";

/** Keep in sync with keyboard navigation in use-asset-search-flow. */
export const VARIANT_GRID_COLUMN_COUNT = 4;

interface VariantGridProps {
  variants: AssetListItem[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function VariantGrid({
  variants,
  highlightedId = null,
  selectedId = null,
  onSelect,
  className,
}: VariantGridProps) {
  return (
    <SelectableGrid
      ariaLabel="Asset variants"
      highlightedId={highlightedId}
      className={cn("grid-cols-4 gap-2", className)}
    >
      {variants.map((variant) => (
        <VariantItem
          key={variant.id}
          variant={variant}
          isHighlighted={highlightedId === variant.id}
          isSelected={selectedId === variant.id}
          onSelect={onSelect}
        />
      ))}
    </SelectableGrid>
  );
}
