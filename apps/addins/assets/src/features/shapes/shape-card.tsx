import { cn } from "@deck-pack/ui/lib/utils";
import { CheckCircle } from "@phosphor-icons/react";

import type { ShapeSearchResult } from "./types";

interface ShapeCardProps {
  shape: ShapeSearchResult;
  isHighlighted?: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ShapeCard({
  shape,
  isHighlighted = false,
  isSelected,
  onSelect,
}: ShapeCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${shape.name}, ${shape.category}`}
      tabIndex={isHighlighted ? 0 : -1}
      data-highlighted={isHighlighted || undefined}
      className={cn(
        "flex min-w-0 w-full flex-col rounded-md p-1.5 text-start transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
        isSelected && "bg-primary/10 text-primary",
        isHighlighted && "outline-2 outline-offset-2 outline-primary",
      )}
      onClick={() => onSelect(shape.id)}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted/60 p-3">
          <img
            src={shape.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-contain"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        </div>

        <div className="flex min-w-0 items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium leading-5 text-foreground"
              title={shape.name}
            >
              {shape.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{shape.category}</p>
          </div>
          {isSelected ? (
            <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          ) : null}
        </div>
      </div>
    </button>
  );
}
