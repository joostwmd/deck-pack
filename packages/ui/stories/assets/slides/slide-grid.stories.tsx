import type { Meta, StoryObj } from "@storybook/react-vite";

import { SlideGrid } from "@/features/slides/slide-grid";

import { withAssetsPanel } from "../decorators";
import { mockSlideResults } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Slides/SlideGrid",
  component: SlideGrid,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Two-column radiogroup of slide deck thumbnails.",
      },
    },
  },
} satisfies Meta<typeof SlideGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Slide grid with highlight and selection on the first item.
 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <SlideGrid
        slides={mockSlideResults}
        highlightedId={mockSlideResults[0]?.id}
        selectedId={mockSlideResults[0]?.id}
        onSelect={() => undefined}
      />
    </div>
  ),
};
