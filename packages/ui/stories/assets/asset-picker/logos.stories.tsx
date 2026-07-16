import type { Meta, StoryObj } from "@storybook/react-vite";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";

import { withAssetsPanel } from "../decorators";
import { logosPickerConfig } from "../fixtures/asset-picker-configs";

const { searchHint, ...logosArgs } = logosPickerConfig;

const meta = {
  title: "Assets/AssetPicker/Logos",
  component: AssetSearchPanel,
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Mock logo search panel. ${searchHint}`,
      },
    },
  },
} satisfies Meta<typeof AssetSearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: logosArgs,
};
