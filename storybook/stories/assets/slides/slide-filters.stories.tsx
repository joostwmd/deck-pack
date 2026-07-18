import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SlideFiltersBar } from "@/components/slides/slide-filters";
import type { SlideFilters, SlideSort } from "@/components/slides/types";

import { withAssetsPanel } from "../decorators";

const facets = {
  categories: ["Business", "Process", "Marketing"],
  tags: ["summary", "timeline", "intro"],
  aspectRatios: ["16:9", "4:3"] as const,
};

const meta = {
  title: "Assets/Slides/SlideFilters",
  component: SlideFiltersBar,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Filter popover, sort select, and active filter chips for slide search.",
      },
    },
  },
} satisfies Meta<typeof SlideFiltersBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SlideFiltersDemo({ initialFilters = {} }: { initialFilters?: SlideFilters }) {
  const [filters, setFilters] = useState<SlideFilters>(initialFilters);
  const [sort, setSort] = useState<SlideSort>("relevance");
  const activeFilterCount = Object.values(filters).flat().filter(Boolean).length;

  return (
    <div className="p-4">
      <SlideFiltersBar
        filters={filters}
        facets={facets}
        activeFilterCount={activeFilterCount}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
      />
    </div>
  );
}

/**
 * @summary Filters and sort controls with no active filters.
 */
export const Default: Story = {
  render: () => <SlideFiltersDemo />,
};

/**
 * @summary Active category and tag chips rendered below the controls.
 */
export const WithActiveFilters: Story = {
  render: () => (
    <SlideFiltersDemo initialFilters={{ category: "Business", tags: ["summary"] }} />
  ),
};
