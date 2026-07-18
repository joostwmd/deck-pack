import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScreenHeader } from "@/components/asset-browser/screen-header";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/AssetBrowser/ScreenHeader",
  component: ScreenHeader,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Title and helper text header used at the top of feature panels.",
      },
    },
  },
} satisfies Meta<typeof ScreenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Standard panel header with title and description.
 */
export const Default: Story = {
  args: {
    title: "Flags",
    text: "Search and insert country flags into your presentation.",
  },
};
