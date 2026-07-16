import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShapeGrid } from "@/features/shapes/shape-grid";

import { withAssetsPanel } from "../decorators";
import { mockShapeResults } from "../fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Shapes/ShapeGrid",
  component: ShapeGrid,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Two-column radiogroup of shape thumbnails.",
      },
    },
  },
} satisfies Meta<typeof ShapeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Shape grid with highlight and selection on the first item.
 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <ShapeGrid
        shapes={mockShapeResults}
        highlightedId={mockShapeResults[0]?.id}
        selectedId={mockShapeResults[0]?.id}
        onSelect={() => undefined}
      />
    </div>
  ),
};
