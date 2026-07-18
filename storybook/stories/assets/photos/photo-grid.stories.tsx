import type { Meta, StoryObj } from "@storybook/react-vite";

import { PhotoGrid } from "@/components/photos/photo-grid";

import { withAssetsPanel } from "../decorators";
import { mockPhotoResults } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Photos/PhotoGrid",
  component: PhotoGrid,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Two-column radiogroup of Pexels photo thumbnails.",
      },
    },
  },
} satisfies Meta<typeof PhotoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Photo grid with highlight and selection on the first item.
 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <PhotoGrid
        photos={mockPhotoResults}
        highlightedId={mockPhotoResults[0]?.id}
        selectedId={mockPhotoResults[0]?.id}
        onSelect={() => undefined}
      />
    </div>
  ),
};
