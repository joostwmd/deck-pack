import type { Meta, StoryObj } from "@storybook/react-vite";

import { LogosPage } from "@/pages/logos/logos-page";

import { withAssetsPanel } from "../decorators";
import { logosBrowserConfig } from "@fixtures/asset-browser-configs";

const meta = {
  title: "Assets/AssetBrowser/Logos",
  component: LogosPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected logo search page using \`LogosPage\` and test services. ${logosBrowserConfig.searchHint}`,
      },
    },
  },
} satisfies Meta<typeof LogosPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default logo search page wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <LogosPage />,
};
