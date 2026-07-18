import { cn } from "@deck-pack/ui/lib/utils";
import { useEffect, useRef } from "react";

import { PhotoCard } from "./photo-card";
import type { PhotoSearchResult } from "./types";

interface PhotoGridProps {
  photos: PhotoSearchResult[];
  highlightedId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function PhotoGrid({
  photos,
  highlightedId = null,
  selectedId = null,
  onSelect,
  className,
}: PhotoGridProps) {
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
      aria-label="Photo search results"
      className={cn("grid w-full grid-cols-2 gap-3", className)}
    >
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isHighlighted={highlightedId === photo.id}
          isSelected={selectedId === photo.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
