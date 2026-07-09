import type { LogoListItem } from "@/hooks/use-logo-search";

import { LogoVariantItem } from "./logo-variant-item";

interface LogoVariantGridProps {
  variants: LogoListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export function LogoVariantGrid({ variants, selectedId = null, onSelect }: LogoVariantGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {variants.map((variant) => (
        <LogoVariantItem
          key={variant.id}
          variant={variant}
          isSelected={selectedId === variant.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
