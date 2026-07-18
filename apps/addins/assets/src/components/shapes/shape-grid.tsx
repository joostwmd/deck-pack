import { SelectableGrid } from "@/components/asset-browser/selectable-grid";

import { ShapeCard } from "./shape-card";
import type { ShapeSearchResult } from "./types";

interface ShapeGridProps {
  shapes: ShapeSearchResult[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function ShapeGrid({
  shapes,
  highlightedId = null,
  selectedId = null,
  onSelect,
  className,
}: ShapeGridProps) {
  return (
    <SelectableGrid
      ariaLabel="Shape library results"
      highlightedId={highlightedId}
      className={className}
    >
      {shapes.map((shape) => (
        <ShapeCard
          key={shape.id}
          shape={shape}
          isHighlighted={highlightedId === shape.id}
          isSelected={selectedId === shape.id}
          onSelect={onSelect}
        />
      ))}
    </SelectableGrid>
  );
}
