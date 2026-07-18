import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef } from "react";

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
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlightedItem = gridRef.current?.querySelector<HTMLButtonElement>(
      '[data-highlighted="true"]',
    );

    if (!highlightedItem) {
      return;
    }

    highlightedItem.focus({ preventScroll: true });
    highlightedItem.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [highlightedId]);

  return (
    <div
      ref={gridRef}
      role="radiogroup"
      aria-label="Shape library results"
      className={cn("grid w-full grid-cols-2 gap-3", className)}
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
    </div>
  );
}
