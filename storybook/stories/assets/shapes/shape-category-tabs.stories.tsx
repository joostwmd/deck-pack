import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ShapeCategoryTabs } from "@/components/shapes/shape-category-tabs";

import { withAssetsPanel } from "../decorators";

const categories = ["Arrows", "Basic", "Flow", "Charts"];

const meta = {
  title: "Assets/Shapes/ShapeCategoryTabs",
  component: ShapeCategoryTabs,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Category tablist for filtering the shape library.",
      },
    },
  },
} satisfies Meta<typeof ShapeCategoryTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function ShapeCategoryTabsDemo({ initialCategory }: { initialCategory?: string }) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory);

  return (
    <div className="p-4">
      <ShapeCategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
      />
    </div>
  );
}

/**
 * @summary All categories tab selected by default.
 */
export const Default: Story = {
  render: () => <ShapeCategoryTabsDemo />,
};

/**
 * @summary Specific category tab selected.
 */
export const ActiveCategory: Story = {
  render: () => <ShapeCategoryTabsDemo initialCategory="Arrows" />,
};
