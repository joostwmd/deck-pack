import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { PhotoFiltersBar } from "@/features/photos/photo-filters";
import type { PhotoFilters } from "@/features/photos/types";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Photos/PhotoFilters",
  component: PhotoFiltersBar,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Popover filter bar for orientation, color, size, and locale.",
      },
    },
  },
} satisfies Meta<typeof PhotoFiltersBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function PhotoFiltersDemo({ initialFilters = {} }: { initialFilters?: PhotoFilters }) {
  const [filters, setFilters] = useState<PhotoFilters>(initialFilters);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex justify-end p-4">
      <PhotoFiltersBar
        filters={filters}
        activeFilterCount={activeFilterCount}
        onChange={setFilters}
      />
    </div>
  );
}

/**
 * @summary Filters button with no active filters.
 */
export const Default: Story = {
  render: () => <PhotoFiltersDemo />,
};

/**
 * @summary Filters button showing an active filter count badge.
 */
export const WithActiveFilters: Story = {
  render: () => (
    <PhotoFiltersDemo initialFilters={{ orientation: "landscape", color: "blue" }} />
  ),
};
