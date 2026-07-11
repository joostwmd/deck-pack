import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef } from "react";

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
      aria-label="Slide search results"
      className={cn("grid w-full grid-cols-2 gap-3", className)}
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
    </div>
  );
}
