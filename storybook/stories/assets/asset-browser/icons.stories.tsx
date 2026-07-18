import type { Meta, StoryObj } from "@storybook/react-vite";

import { IconsPage } from "@/pages/icons/icons-page";

import { withAssetsPanel } from "../decorators";
import { iconsBrowserConfig } from "@fixtures/asset-browser-configs";

const meta = {
  title: "Assets/AssetBrowser/Icons",
  component: IconsPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected icon search page using \`IconsPage\` and test services. ${iconsBrowserConfig.searchHint}`,
      },
    },
  },
} satisfies Meta<typeof IconsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default icon search page wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <IconsPage />,
};
