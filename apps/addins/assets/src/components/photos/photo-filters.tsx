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
import { FunnelSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import type { PhotoFilters, PhotoLocale, PhotoNamedColor, PhotoOrientation, PhotoSize } from "./types";

const ORIENTATION_OPTIONS: Array<{ value: PhotoOrientation; label: string }> = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
];

const COLOR_OPTIONS: Array<{ value: PhotoNamedColor; label: string; swatch: string }> = [
  { value: "red", label: "Red", swatch: "#ef4444" },
  { value: "orange", label: "Orange", swatch: "#f97316" },
  { value: "yellow", label: "Yellow", swatch: "#eab308" },
  { value: "green", label: "Green", swatch: "#22c55e" },
  { value: "turquoise", label: "Turquoise", swatch: "#14b8a6" },
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "violet", label: "Violet", swatch: "#8b5cf6" },
  { value: "pink", label: "Pink", swatch: "#ec4899" },
  { value: "brown", label: "Brown", swatch: "#92400e" },
  { value: "black", label: "Black", swatch: "#111827" },
  { value: "gray", label: "Gray", swatch: "#9ca3af" },
  { value: "white", label: "White", swatch: "#f9fafb" },
];

const SIZE_OPTIONS: Array<{ value: PhotoSize; label: string }> = [
  { value: "large", label: "Large (24MP+)" },
  { value: "medium", label: "Medium (12MP+)" },
  { value: "small", label: "Small (4MP+)" },
];

const LOCALE_OPTIONS: Array<{ value: PhotoLocale; label: string }> = [
  { value: "en-US", label: "English (US)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "es-ES", label: "Spanish" },
  { value: "it-IT", label: "Italian" },
  { value: "nl-NL", label: "Dutch" },
  { value: "pt-BR", label: "Portuguese (BR)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

interface PhotoFiltersProps {
  filters: PhotoFilters;
  activeFilterCount: number;
  onChange: (filters: PhotoFilters) => void;
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

export function PhotoFiltersBar({ filters, activeFilterCount, onChange }: PhotoFiltersProps) {
  const clearAll = () => onChange({});

  const updateFilter = <K extends keyof PhotoFilters>(key: K, value: PhotoFilters[K]) => {
    const next = { ...filters };

    if (value == null) {
      delete next[key];
      onChange(next);
      return;
    }

    next[key] = value;
    onChange(next);
  };

  return (
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
                : "Open photo filters"
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
            id="photo-orientation-filter"
            label="Orientation"
            placeholder="Any orientation"
            value={filters.orientation}
            onChange={(value) => updateFilter("orientation", value)}
          >
            {ORIENTATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </FilterField>

          <FilterField
            id="photo-color-filter"
            label="Color"
            placeholder="Any color"
            value={filters.color}
            onChange={(value) => updateFilter("color", value)}
          >
            {COLOR_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-3 rounded-full border border-border/60"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden
                  />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </FilterField>

          <FilterField
            id="photo-size-filter"
            label="Minimum size"
            placeholder="Any size"
            value={filters.size}
            onChange={(value) => updateFilter("size", value)}
          >
            {SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </FilterField>

          <FilterField
            id="photo-locale-filter"
            label="Search locale"
            placeholder="Default locale"
            value={filters.locale}
            onChange={(value) => updateFilter("locale", value)}
          >
            {LOCALE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </FilterField>
        </div>
      </PopoverContent>
    </Popover>
  );
}
