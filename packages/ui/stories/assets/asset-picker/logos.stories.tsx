import type { Meta, StoryObj } from "@storybook/react-vite";

import { LogosPanel } from "@/features/logos/logos-panel";

import { withAssetsPanel } from "../decorators";
import { logosPickerConfig } from "@fixtures/asset-picker-configs";

const meta = {
  title: "Assets/AssetPicker/Logos",
  component: LogosPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected logo search panel using \`LogosPanel\` and test services. ${logosPickerConfig.searchHint}`,
      },
    },
  },
} satisfies Meta<typeof LogosPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default logo search panel wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <LogosPanel />,
};
