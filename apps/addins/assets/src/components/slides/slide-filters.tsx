import { Button } from "@deck-pack/ui/components/system/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@deck-pack/ui/components/system/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";
import { cn } from "@deck-pack/ui/lib/utils";
import { FunnelSimple, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import type { SlideAspectRatio, SlideFilters, SlideSearchFacets, SlideSort } from "./types";

const SORT_OPTIONS: Array<{ value: SlideSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
];

interface SlideFiltersBarProps {
  filters: SlideFilters;
  facets: SlideSearchFacets;
  activeFilterCount: number;
  sort: SlideSort;
  onFiltersChange: (filters: SlideFilters) => void;
  onSortChange: (sort: SlideSort) => void;
}

interface FilterFieldProps<T extends string> {
  id: string;
  label: string;
  placeholder: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  children: ReactNode;
}

function FilterField<T extends string>({
  id,
  label,
  placeholder,
  value,
  onChange,
  children,
}: FilterFieldProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>

      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger id={id} size="sm" className="h-8 w-full min-w-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function toggleTag(tags: string[] | undefined, tag: string) {
  const current = tags ?? [];

  if (current.includes(tag)) {
    return current.filter((item) => item !== tag);
  }

  return [...current, tag];
}

export function SlideFiltersBar({
  filters,
  facets,
  activeFilterCount,
  sort,
  onFiltersChange,
  onSortChange,
}: SlideFiltersBarProps) {
  const clearAll = () => onFiltersChange({});

  const updateFilter = <K extends keyof SlideFilters>(key: K, value: SlideFilters[K]) => {
    const next = { ...filters };

    if (value == null || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
      onFiltersChange(next);
      return;
    }

    next[key] = value;
    onFiltersChange(next);
  };

  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (filters.category) {
    activeChips.push({
      key: `category-${filters.category}`,
      label: filters.category,
      onRemove: () => updateFilter("category", undefined),
    });
  }

  if (filters.aspectRatio) {
    activeChips.push({
      key: `aspect-${filters.aspectRatio}`,
      label: filters.aspectRatio,
      onRemove: () => updateFilter("aspectRatio", undefined),
    });
  }

  for (const tag of filters.tags ?? []) {
    activeChips.push({
      key: `tag-${tag}`,
      label: tag,
      onRemove: () => updateFilter("tags", toggleTag(filters.tags, tag)),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="relative shrink-0 gap-1.5 px-2.5"
                aria-label={
                  activeFilterCount > 0
                    ? `Filters, ${activeFilterCount} active`
                    : "Open slide filters"
                }
              >
                <FunnelSimple className="size-4" aria-hidden />
                <span className="text-xs font-medium">Filters</span>
                {activeFilterCount > 0 ? (
                  <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            }
          />

          <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Filters</p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5">
              <FilterField
                id="slide-category-filter"
                label="Category"
                placeholder="Any category"
                value={filters.category}
                onChange={(value) => updateFilter("category", value)}
              >
                {facets.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </FilterField>

              <FilterField
                id="slide-aspect-ratio-filter"
                label="Aspect ratio"
                placeholder="Any aspect ratio"
                value={filters.aspectRatio}
                onChange={(value) => updateFilter("aspectRatio", value as SlideAspectRatio)}
              >
                {facets.aspectRatios.map((aspectRatio) => (
                  <SelectItem key={aspectRatio} value={aspectRatio}>
                    {aspectRatio}
                  </SelectItem>
                ))}
              </FilterField>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-foreground">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {facets.tags.map((tag) => {
                    const isActive = filters.tags?.includes(tag) ?? false;

                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={isActive}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/60",
                        )}
                        onClick={() => updateFilter("tags", toggleTag(filters.tags, tag))}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sort} onValueChange={(value) => onSortChange(value as SlideSort)}>
          <SelectTrigger size="sm" className="h-8 min-w-[7.5rem] shrink-0">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:bg-muted/70"
              onClick={chip.onRemove}
            >
              {chip.label}
              <X className="size-3" aria-hidden />
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
