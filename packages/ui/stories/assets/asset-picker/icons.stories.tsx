import type { Meta, StoryObj } from "@storybook/react-vite";

import { IconsPanel } from "@/features/icons/icons-panel";

import { withAssetsPanel } from "../decorators";
import { iconsPickerConfig } from "../fixtures/asset-picker-configs";

const meta = {
  title: "Assets/AssetPicker/Icons",
  component: IconsPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected icon search panel using \`IconsPanel\` and test services. ${iconsPickerConfig.searchHint}`,
      },
    },
  },
} satisfies Meta<typeof IconsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default icon search panel wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <IconsPanel />,
};
