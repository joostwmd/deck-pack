import { SelectableGrid } from "@/components/asset-browser/selectable-grid";

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
  return (
    <SelectableGrid
      ariaLabel="Photo search results"
      highlightedId={highlightedId}
      className={className}
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
    </SelectableGrid>
  );
}
