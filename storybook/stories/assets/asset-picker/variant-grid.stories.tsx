import type { Meta, StoryObj } from "@storybook/react-vite";

import { VariantGrid } from "@/components/asset-browser/variant-grid";

import { withAssetsPanel } from "../decorators";
import { mockFlagResults } from "@fixtures/asset-search";

const variants = [
  { id: "flag-nl-variant-0", name: "4:3", imageUrl: mockFlagResults[0]!.imageUrl },
  { id: "flag-nl-variant-1", name: "1:1", imageUrl: mockFlagResults[0]!.imageUrl },
];

const meta = {
  title: "Assets/AssetPicker/VariantGrid",
  component: VariantGrid,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Two-column radiogroup for choosing an asset variant before insert.",
      },
    },
  },
} satisfies Meta<typeof VariantGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Variant grid with highlight and selection on the first item.
 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <VariantGrid
        variants={variants}
        highlightedId={variants[0]?.id}
        selectedId={variants[0]?.id}
        onSelect={() => undefined}
      />
    </div>
  ),
};

/**
 * @summary No variant selected yet; first item is keyboard-highlighted only.
 */
export const HighlightOnly: Story = {
  tags: ["!manifest"],
  render: () => (
    <div className="p-4">
      <VariantGrid variants={variants} highlightedId={variants[1]?.id} onSelect={() => undefined} />
    </div>
  ),
};
