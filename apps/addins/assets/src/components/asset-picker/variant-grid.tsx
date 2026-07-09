import type { AssetListItem } from "@/lib/asset-types";

import { VariantItem } from "./variant-item";

interface VariantGridProps {
  variants: AssetListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export function VariantGrid({ variants, selectedId = null, onSelect }: VariantGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {variants.map((variant) => (
        <VariantItem
          key={variant.id}
          variant={variant}
          isSelected={selectedId === variant.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
