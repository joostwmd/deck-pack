import { cn } from "@deck-pack/ui/lib/utils";
import { CheckCircle } from "@phosphor-icons/react";

import { InternalScopeBadge } from "@/components/asset-browser/internal-scope-badge";

import type { SlideSearchResult } from "./types";

interface SlideCardProps {
  slide: SlideSearchResult;
  isHighlighted?: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function SlideCard({
  slide,
  isHighlighted = false,
  isSelected,
  onSelect,
}: SlideCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${slide.name}, ${slide.category}`}
      tabIndex={isHighlighted ? 0 : -1}
      data-highlighted={isHighlighted || undefined}
      className={cn(
        "flex min-w-0 w-full flex-col rounded-md p-1.5 text-start transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
        isSelected && "bg-primary/10 text-primary",
        isHighlighted && "outline-2 outline-offset-2 outline-primary",
      )}
      onClick={() => onSelect(slide.id)}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md bg-muted/60">
          <InternalScopeBadge scope={slide.scope} className="absolute right-1.5 top-1.5 z-10 text-[10px]" />
          <img
            src={slide.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        </div>

        <div className="flex min-w-0 items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-5 text-foreground" title={slide.name}>
              {slide.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {slide.category} · {slide.aspectRatio}
            </p>
          </div>
          {isSelected ? (
            <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          ) : null}
        </div>
      </div>
    </button>
  );
}
