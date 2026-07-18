import type { AssetListItem } from "@/types/asset-types";

import { SelectableGrid } from "./selectable-grid";
import { VariantItem } from "./variant-item";

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
    <SelectableGrid ariaLabel="Asset variants" highlightedId={highlightedId} className={className}>
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
