import { SelectableGrid } from "@/components/asset-browser/selectable-grid";

import { SlideCard } from "./slide-card";
import type { SlideSearchResult } from "./types";

interface SlideGridProps {
  slides: SlideSearchResult[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function SlideGrid({
  slides,
  highlightedId = null,
  selectedId = null,
  onSelect,
  className,
}: SlideGridProps) {
  return (
    <SelectableGrid
      ariaLabel="Slide search results"
      highlightedId={highlightedId}
      className={className}
    >
      {slides.map((slide) => (
        <SlideCard
          key={slide.id}
          slide={slide}
          isHighlighted={highlightedId === slide.id}
          isSelected={selectedId === slide.id}
          onSelect={onSelect}
        />
      ))}
    </SelectableGrid>
  );
}
