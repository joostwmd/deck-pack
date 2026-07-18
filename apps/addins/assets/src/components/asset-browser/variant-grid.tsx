import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef } from "react";

import type { AssetListItem } from "@/types/asset-types";

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
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlightedItem = gridRef.current?.querySelector<HTMLButtonElement>(
      '[data-highlighted="true"]',
    );

    if (!highlightedItem) return;

    highlightedItem.focus({ preventScroll: true });
    highlightedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [highlightedId]);

  return (
    <div
      ref={gridRef}
      role="radiogroup"
      aria-label="Asset variants"
      className={cn("grid w-full grid-cols-2 gap-3", className)}
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
    </div>
  );
}
