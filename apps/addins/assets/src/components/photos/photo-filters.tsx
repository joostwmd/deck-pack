import { SelectItem } from "@deck-pack/ui/components/system/select";

import { FilterField, FiltersPopover } from "@/components/asset-browser/filters-popover";

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
    <FiltersPopover
      activeFilterCount={activeFilterCount}
      ariaLabel="Open photo filters"
      onClearAll={clearAll}
    >
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
    </FiltersPopover>
  );
}
